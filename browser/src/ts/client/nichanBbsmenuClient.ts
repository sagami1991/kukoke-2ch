import { xhrRequest, sjisBufferToStr } from 'common/commons';
import { Nichan } from 'const';

export class NichanBbsMenuClient {
	public static async fetchBoards(): Promise<string> {
		const res = await xhrRequest({ url: Nichan.BBS_MENU_URL });
		switch (res.statusCode) {
		case 200:
			return sjisBufferToStr(res.body);
		default:
			throw new Error("bbs menu につながらない");
		}
	}
}