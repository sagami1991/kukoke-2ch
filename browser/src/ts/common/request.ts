import { CancelablePromise } from './promise';
import { decode } from 'iconv-lite';
import { XhrRequestError } from "common/error";

export interface IRequestOption {
	method?: "GET" | "POST";
	url: string;
	headers?: IRequestHeaders;
	formData?: Map<string, string>;
	contentType?: "application/x-www-form-urlencoded";
	onProgress?: (loaded: number, total: number) => void;
	onHeaderReceive?: (responseHeader: IResponseHeader) => void;
	onAbort?: () => void;
	responseType?: "arraybuffer" | "blob";
}

export interface IRequestHeaders {
	"Content-Type"?: "application/x-www-form-urlencoded";
	"Kukoke-Referer"?: string;
	"If-Modified-Since"?: string;
	"Range"?: string;
}

/** 全てlowercaseに変換している */
export interface IResponseHeader {
	"content-type"?: string;
	"content-length"?: string;
	"last-modified"?: string;
}

export interface IXhrResponse<T = Buffer> {
	statusCode: number;
	headers: IResponseHeader;
	body: T;
}

export function xhrRequest<T = Buffer>(option: IRequestOption) {
	const xhr = new XMLHttpRequest();
	return new CancelablePromise<IXhrResponse<T>>((resolve, reject) => {
		const {onProgress, onHeaderReceive, onAbort, responseType} = option;
		xhr.open(option.method || "GET", option.url, true);
		xhr.responseType = option.responseType || "arraybuffer";
		setRequestHeaders(xhr, option);
		xhr.addEventListener("error", () => {
			reject(new XhrRequestError("xhr error"));
		});
		xhr.addEventListener("abort", () => {
			if (onAbort) {
				onAbort();
			}
			reject("xhr abort");
		});
		xhr.addEventListener("readystatechange", () => {
			if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
				if (onHeaderReceive) {
					onHeaderReceive(getResponseHeaders(xhr));
				}
			}
		});
		xhr.addEventListener("progress", (e) => {
			if (onProgress) {
				onProgress(e.loaded, e.total);
			}
		});
		xhr.addEventListener("load", () => {
			let responseBody = xhr.responseType === "arraybuffer" ? new Buffer(new Uint8Array(xhr.response)) : xhr.response;
			resolve({
				statusCode: xhr.status,
				headers: getResponseHeaders(xhr),
				body: responseBody
			});

		});
		xhr.send(option.formData ? mapToForm(option.formData) : undefined);
	}).setCancelCallback(() => {
		xhr.abort();
	});
}

function mapToForm(map: Map<string, string>) {
	return Array.from(map.entries())
		.map(([k, v]) => {
			return encodeURIComponent(k) + '=' + encodeURIComponent(v);
		}).join('&')
		.replace(/%20/g, '+');
}

/** SJISのバイナリデータをstringにする */
export function sjisBufferToStr(sjisBuffer: Buffer) {
	return decode(sjisBuffer, "Shift_JIS");
}

function setRequestHeaders(xhr: XMLHttpRequest, options: IRequestOption): void {
	if (options.headers) {
		outer: for (let [k, v] of Object.entries(options.headers)) {
			switch (k) {
				case 'User-Agent':
				case 'Accept-Encoding':
				case 'Content-Length':
					// unsafe headers
					continue outer;
			}
			if (v) {
				xhr.setRequestHeader(k, v);
			}
		}
	}
}

function getResponseHeaders(xhr: XMLHttpRequest): IResponseHeader {
	const headers: { [name: string]: string } = Object.create(null);
	for (const line of xhr.getAllResponseHeaders().split(/\r\n|\n|\r/g)) {
		if (line) {
			const idx = line.indexOf(':');
			headers[line.substr(0, idx).trim().toLowerCase()] = line.substr(idx + 1).trim();
		}
	}
	return headers;
}