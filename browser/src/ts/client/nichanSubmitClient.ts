import { XhrRequestHeaders } from '../common/request';
import { BoardTable } from '../database/tables';
import { xhrRequest, sjisBufferToStr } from 'common/commons';
import { NichanFormValue } from "panel/formPanel";
import { ElementUtil } from "common/element";

interface SubmitResponse {
	type: "success" | "fail" | "unexpectedCode";
	title: string;
	body: string;
}
export class NichanSubmitClient {
	public static async submitRes(board: BoardTable, datNo: number, values: NichanFormValue): Promise<SubmitResponse> {
		const res = await xhrRequest({
			method: "POST",
			headers: <XhrRequestHeaders>{
				"Kukoke-Referer": `http://${board.subDomain}.${board.domain}/${board.path}`,
				"Content-Type": "application/x-www-form-urlencoded"
			},
			url: `http://${board.subDomain}.${board.domain}/test/bbs.cgi`,
			formData: new Map([
				["bbs", board.path],
				["key", datNo.toString()],
				["mail", values.mail],
				["FROM", values.name],
				["MESSAGE", values.message],
				["time", Math.floor(Date.now() / 1000).toString()],
				["submit", "書き込む"]
			]),
		});
		switch (res.statusCode) {
		case 200:
			const resBodey = sjisBufferToStr(res.body);
			const html = ElementUtil.htmlParser(resBodey);
			const titleElem = html.querySelector("title");
			const bodyElem = html.querySelector("body");
			if (!titleElem || !titleElem.textContent || !bodyElem || !bodyElem.textContent) {
				return {
					type: "fail",
					title: "2chの書き込みレスポンスタイトルが解釈できません",
					body: "2chの書き込みレスポンスタイトルが解釈できません",
				};
			}
			if (titleElem.textContent === "書きこみました。") {
				return {
					type: "success",
					title: titleElem.textContent,
					body: bodyElem.textContent
				};
			} else {
				return {
					type: "fail",
					title: titleElem.textContent,
					body: bodyElem.textContent
				};
			}
		default:
			return {
				type: "unexpectedCode",
				title: "2chが200番以外のレスポンスコードを返しました",
				body: sjisBufferToStr(res.body)
			};
		}
	}

}