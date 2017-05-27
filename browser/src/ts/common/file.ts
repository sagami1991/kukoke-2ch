import * as fs from "fs";
import {electron} from "./libs";


export namespace FileUtil {

	function getPath(path: string) {
		return `${electron.app.getPath("userData")}/${path}`;
	}

	export function readFile(path: string) {
		return new Promise<Buffer | null>((resolve) => {
			fs.readFile(getPath(path), (err, data) => {
				resolve(err ? null : data);
			});
		});
	};


	export function wrtiteFile(path: string, data: Buffer | string) {
		return new Promise((resolve, reject) => {
			fs.writeFile(getPath(path), data, err => {
				if (err) {
					reject();
					return;
				}
				console.log(`write file path = ${getPath(path)}`);
				resolve();
			});
		});
	};

	/** 失敗しても必ずresolve */
	export function deleteFile(path: string) {
		return new Promise((resolve, reject) => {
			fs.unlink(path, (err) => {
				resolve();
			});
		});
	}

}