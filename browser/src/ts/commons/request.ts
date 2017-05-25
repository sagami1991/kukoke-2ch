import { statusBar } from '../view/statusBarView';
import { MyPromise } from './promise';
import { decode } from 'iconv-lite';

export interface RequestOption {
	method?: "GET" | "POST";
	url: string;
	headers?: XhrHeaders;
	data?: FormData;
}

export interface XhrHeaders {
	[name: string]: string;
}
export interface XhrResponse {
	statusCode: number;
	headers: XhrHeaders;
	body: Buffer;
}

export function xhrRequest(option: RequestOption) {
	const xhr = new XMLHttpRequest();
	return new MyPromise<XhrResponse>((resolve, reject) => {
		xhr.open(option.method || "GET", option.url, true);
		statusBar.message(`リクエスト開始 ${option.url}`);
		setRequestHeaders(xhr, option);
		xhr.onerror = () => {
			statusBar.message(`リクエスト失敗 ${option.url}`);
			reject();
		};
		xhr.responseType = 'arraybuffer';
		xhr.onload = () => {
			statusBar.message(`レスポンス完了 url: ${option.url} status: ${xhr.status}`);
			resolve({
				statusCode: xhr.status,
				headers: getResponseHeaders(xhr),
				body: new Buffer(new Uint8Array(xhr.response))
			});
		};
		xhr.send(option.data);
	});
}

export function mapToFormData(map: { [key: string]: string }): FormData {
	const form = new FormData;
	Object.keys(map).forEach(key => {
		form.append(key, map[key]);
	});
	return form;
}

/** SJISのバイナリデータをstringにする */
export function sjisBufferToStr(sjisBuffer: Buffer) {
	return decode(sjisBuffer, "Shift_JIS");
}

function setRequestHeaders(xhr: XMLHttpRequest, options: RequestOption): void {
	if (options.headers) {
		outer: for (let k in options.headers) {
			switch (k) {
				case 'User-Agent':
				case 'Accept-Encoding':
				case 'Content-Length':
					// unsafe headers
					continue outer;
			}
			xhr.setRequestHeader(k, options.headers[k]);
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