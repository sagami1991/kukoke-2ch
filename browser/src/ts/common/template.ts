import { _ } from "./libs";
const dateFmt = require('dateformat');
export namespace templateUtil {
	export function each<T>(array: T[], cb: (item: T, index: number) => string): string {
		return array.map((item, index) => cb(item, index)).join("");
	}

	export function escape(raw: string): string {
		return _.escape(raw);
	}

	export function dateFormat(date: Date): string {
		return dateFmt(date, "mm/dd HH:MM");
	}
	export function dateFormatForFile(date: Date): string {
		return dateFmt(date, "yyyy-mm-dd-HHMMssl");
	}
	export function numberFormat(num: number, decimal: number): string {
		return new Number(num).toFixed(decimal);
	}

	export function kbFormat(byteLength: number) {
		return `${new Number(byteLength / 1024).toFixed(1)}KB`;
	}


	export function when(condition: any, result: () => string): string {
		if (condition) {
			return result();
		} else {
			return "";
		}
	}
}