import { xhrRequest, sjisBufferToStr } from '../../commons/commons';
import { Nichan } from '../constants';

export class BbsMenuClient {
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