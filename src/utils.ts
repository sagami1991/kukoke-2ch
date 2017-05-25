import * as fs from "fs";
import {app} from "electron";

export function toJson(object: {}) {
	return JSON.stringify(object, null, "    ");
};

export function readJsonFile<T>(path: string) {
	return new Promise<T | null>((resolve) => {
		fs.readFile(path, "utf8", (err, data) => {
			try {
				resolve(JSON.parse(data));
			} catch (error) {
				resolve(null);
			}
		});
	});
};


export function wrtiteJsonFile<T>(path: string, obj: T) {
	return new Promise(resolve => {
		fs.writeFile(path, toJson(obj), err => {
			if (!err) console.log(`write file  path = ${path}`);
			resolve(err);
		});
	});
};

export function mkdir(dirName: string) {
	const path = `${app.getPath("userData")}/${dirName}`;
	return new Promise(resolve => {
		fs.access(path, (err) => {
			if (err) {
				console.log("ディレクトリを作成 " + path);
				fs.mkdir(path, (err) => {
					if (err) {
						console.log("ディレクトリ作成に失敗 " + path);
					}
					resolve();
				});
			} else {
				resolve();
			}
		});
	});
}

