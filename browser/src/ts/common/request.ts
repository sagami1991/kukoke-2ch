import { notify } from './libs';
import { statusBar } from '../view/statusBarView';
import { MyPromise } from './promise';
import { decode } from 'iconv-lite';

export interface RequestOption {
	method?: "GET" | "POST";
	url: string;
	headers?: XhrRequestHeaders;
	data?: Map<string, string>;
	contentType?: "application/x-www-form-urlencoded";
}

export interface XhrRequestHeaders {
	"Kukoke-Referer"?: string;
	"last-modified"?: string;
	"If-Modified-Since"?: string;
	"Range"?: string;
}
export interface XhrResponse {
	statusCode: number;
	headers: XhrRequestHeaders;
	body: Buffer;
}

export function xhrRequest(option: RequestOption) {
	const xhr = new XMLHttpRequest();
	return new MyPromise<XhrResponse>((resolve, reject) => {
		xhr.open(option.method || "GET", option.url, true);
		xhr.onerror = () => {
			notify.error("リクエスト失敗");
			reject();
		};
		xhr.responseType = 'arraybuffer';
		setRequestHeaders(xhr, option);
		if (option.contentType) {
			xhr.setRequestHeader("Content-Type", option.contentType);
		}
		xhr.onload = () => {
			statusBar.message(`レスポンス完了 url: ${option.url} status: ${xhr.status}`);
			resolve({
				statusCode: xhr.status,
				headers: getResponseHeaders(xhr),
				body: new Buffer(new Uint8Array(xhr.response))
			});
		};
		xhr.send(option.data ? mapToForm(option.data) : undefined);
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

function getResponseHeaders(xhr: XMLHttpRequest): { [name: string]: string } {
	const headers: { [name: string]: string } = Object.create(null);
	for (const line of xhr.getAllResponseHeaders().split(/\r\n|\n|\r/g)) {
		if (line) {
			const idx = line.indexOf(':');
			headers[line.substr(0, idx).trim().toLowerCase()] = line.substr(idx + 1).trim();
		}
	}
	return headers;
}