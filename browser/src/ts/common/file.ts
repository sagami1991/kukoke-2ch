import { notify } from './libs';
import * as fs from "fs";
import { Consts } from "const";

export namespace FileUtil {

	export function getPath(path: string) {
		return `${Consts.USER_PATH}\\${path}`;
	}

	export function readFile(path: string) {
		return new Promise<Buffer | null>((resolve) => {
			fs.readFile(path, (err, data) => {
				resolve(err ? null : data);
			});
		});
	};


	export function wrtiteFile(path: string, data: Buffer | string | Blob) {
		return new Promise((resolve, reject) => {
			fs.writeFile(path, data, err => {
				if (err) {
					notify.error("ファイル書き込みに失敗 " + path);
					reject(err);
					return;
				}
				resolve();
			});
		});
	};

	/** 失敗しても必ずresolve */
	export function deleteFile(path: string) {
		return new Promise((resolve, reject) => {
			fs.unlink(path, (err) => {
				if (err) {
					console.warn("failed delete file reason: " + err.message);
				}
				resolve();
			});
		});
	}

}