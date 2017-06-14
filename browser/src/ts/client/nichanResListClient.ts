import { XhrRequestHeader } from 'common/request';
import { xhrRequest, XhrResponse } from 'common/commons';
import { NichanAuthClient } from './nichanAuthClient';
import { Nichan } from "const";
import { createHmac } from "crypto";
import { BoardTable } from "database/tables";
import { XhrRequestError } from "common/error";

interface ResponseResult {
	type: "notModified" | "datOti" | "success" | "sabun" | "unexpectedCode";
	response: XhrResponse | null;
}

export class NichanResListClient {
	private static nichanSessionId: string;
	public static async fetchResList(board: BoardTable, datNo: number, reqHeaders?: XhrRequestHeader): Promise<ResponseResult> {
		if (!this.nichanSessionId) {
			this.nichanSessionId = await NichanAuthClient.getSessionId();
		}
		const uri = `/v1/${board.subDomain}/${board.path}/${datNo}`;
		let res: XhrResponse;
		try {
			res = await xhrRequest({
				method: "POST",
				url: `https://api.2ch.net${uri}`,
				headers: <XhrRequestHeader>{...reqHeaders, "Content-Type":  "application/x-www-form-urlencoded"},
				formData: new Map([
					["sid", this.nichanSessionId],
					["hobo", this.calcHoboValue(uri)],
					["appkey", Nichan.APP_KEY],
				]),
			});
		} catch (error) {
			// TODO ステータスコード501(dat落ち)がxhrのerrorが起きて拾えない
			// エラー情報も何も取れないので強引にdat落ち判定にする
			// このエラー調査する net::ERR_CONTENT_DECODING_FAILED
			if (error instanceof XhrRequestError) {
				return {
					type: "datOti",
					response: null
				};
			}
			throw error;
		}
		switch (res.statusCode) {
		case 200: // 新規取得
			return {
				type: "success",
				response: res
			};
		case 206: // 差分取得
			return {
				type: "sabun",
				response: res
			};
		case 304: // 更新なし
			return {
				type: "notModified",
				response: res
			};
		case 401: // sessionIDの有効期限切れ
			this.nichanSessionId = await NichanAuthClient.getSessionId();
			return this.fetchResList(board, datNo, reqHeaders);
		default:
			return {
				type: "unexpectedCode",
				response: res
			};
		}
	}

	private static calcHoboValue(uri: string): string {
		return createHmac('sha256', Nichan.HM_KEY)
			.update(`${uri}${this.nichanSessionId}${Nichan.APP_KEY}`)
			.digest('hex');
	}

}