import { xhrRequest, sjisBufferToStr } from 'common/commons';
import { BoardTable } from "database/tables";

export class NichanSureListClient {
	public static async fetchSures(board: BoardTable): Promise<string> {
		const res = await xhrRequest({
			url: `http://${board.subDomain}.${board.domain}/${board.path}/subject.txt`,
		});
		return sjisBufferToStr(res.body);
	}
}