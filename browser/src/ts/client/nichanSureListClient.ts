import { xhrRequest, sjisBufferToStr } from 'common/commons';
import { BoardAttr } from "database/tables";

export class NichanSureListClient {
	public static async fetchSures(board: BoardAttr): Promise<string> {
		const res = await xhrRequest({
			url: `http://${board.subDomain}.${board.domain}/${board.path}/subject.txt`,
		});
		console.debug(res.statusCode);
		return sjisBufferToStr(res.body);
	}
}