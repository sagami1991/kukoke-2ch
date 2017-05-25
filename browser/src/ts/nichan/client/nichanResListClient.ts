import { XhrHeaders } from '../../commons/request';
import { mapToFormData, sjisBufferToStr, xhrRequest, XhrResponse } from '../../commons/commons';
import { NichanAuthClient } from './nichanAuthClient';
import { Nichan } from "../constants";
import { createHmac } from "crypto";
import { BoardAttr } from "database/tables";
import { statusBar } from "view/statusBarView";

export class NichanResListClient {
	private static nichanSessionId: string;
	public static async fetchResList(board: BoardAttr, datNo: number, reqHeaders: XhrHeaders): Promise<XhrResponse | null> {
		if (!this.nichanSessionId) {
			this.nichanSessionId = await NichanAuthClient.getSessionId();
		}
		const uri = `/v1/${board.subDomain}/${board.path}/${datNo}`;
		const res = await xhrRequest({
			method: "POST",
			url: `https://api.2ch.net${uri}`,
			headers: reqHeaders,
			data: mapToFormData({
				sid: this.nichanSessionId,
				hobo: this.calcHoboValue(uri),
				appkey: Nichan.APP_KEY,
			}),
		});
		switch (res.statusCode) {
		case 200: // 新規取得
		case 206: // 差分取得
		case 501: // dat落ち
			return res;
		case 304: // 更新なし
			statusBar.message("更新なし");
			return null;
		case 401: // 期限切れ
			this.nichanSessionId = await NichanAuthClient.getSessionId();
			return this.fetchResList(board, datNo, reqHeaders);
		default:
			throw new Error(`予期せぬstatusCode: ${res.statusCode}\n responsBody: ` + sjisBufferToStr(res.body));
		}
	}

	private static calcHoboValue(uri: string): string {
		return createHmac('sha256', Nichan.HM_KEY)
			.update(`${uri}${this.nichanSessionId}${Nichan.APP_KEY}`)
			.digest('hex');
	}

}