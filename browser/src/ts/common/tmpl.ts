import { _ } from "./libs";
const dateFmt = require('dateformat');
export namespace tmpl {
	export function each<T>(array: T[], cb: (item: T, index: number) => string): string {
		return array.map((item, index) => cb(item, index)).join("");
	}

	export function escape(raw: string): string {
		return _.escape(raw);
	}

	export function dateFormat(date: Date): string {
		return dateFmt(date, "mm/dd HH:MM");
		// return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
	}

	export function numberFormat(num: number, decimal: number): string {
		return new Number(num).toFixed(decimal);
	}

	export function when(condition: any, result: () => string): string {
		if (condition) {
			return result();
		} else {
			return "";
		}
	}
}