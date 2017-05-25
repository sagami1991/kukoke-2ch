import { jsonParse, jsonString } from './utils';
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

	export async function readJsonFile<T>(path: string) {
		const buffer = await readFile(path);
		if (buffer === null) {
			return null;
		}
		return jsonParse<T>(buffer.toString());
	}

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

	export async function writeJsonFile(path: string, obj: any) {
		await wrtiteFile(path, jsonString(obj));
	}
}