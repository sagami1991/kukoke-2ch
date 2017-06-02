import { notify } from './libs';
import { statusBar } from '../view/statusBarView';
import { CancelablePromise } from './promise';
import { decode } from 'iconv-lite';

export interface RequestOption {
	method?: "GET" | "POST";
	url: string;
	headers?: XhrRequestHeaders;
	formData?: Map<string, string>;
	contentType?: "application/x-www-form-urlencoded";
}

export interface XhrRequestHeaders {
	"Content-Type"?: "application/x-www-form-urlencoded";
	"Kukoke-Referer"?: string;
	"If-Modified-Since"?: string;
	"Range"?: string;
}

export interface XhrResponseHeader {
	"last-modified"?: string;
}

export interface XhrResponse {
	statusCode: number;
	headers: XhrRequestHeaders;
	body: Buffer;
}

export function xhrRequest(option: RequestOption) {
	const xhr = new XMLHttpRequest();
	return new CancelablePromise<XhrResponse>((resolve, reject) => {
		xhr.open(option.method || "GET", option.url, true);
		xhr.responseType = 'arraybuffer';
		setRequestHeaders(xhr, option);
		xhr.addEventListener("error", () => {
			notify.error("リクエスト失敗");
			reject("xhr error");
		});
		xhr.addEventListener("load", () => {
			statusBar.message(`レスポンス完了 url: ${option.url} status: ${xhr.status}`);
			resolve({
				statusCode: xhr.status,
				headers: getResponseHeaders(xhr),
				body: new Buffer(new Uint8Array(xhr.response))
			});

		});
		xhr.send(option.formData ? mapToForm(option.formData) : undefined);
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

function setRequestHeaders(xhr: XMLHttpRequest, options: RequestOption): void {
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

function getResponseHeaders(xhr: XMLHttpRequest): XhrResponseHeader {
	const headers: { [name: string]: string } = Object.create(null);
	for (const line of xhr.getAllResponseHeaders().split(/\r\n|\n|\r/g)) {
		if (line) {
			const idx = line.indexOf(':');
			headers[line.substr(0, idx).trim().toLowerCase()] = line.substr(idx + 1).trim();
		}
	}
	return headers;
}