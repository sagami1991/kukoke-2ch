import { xhrRequest, sjisBufferToStr } from 'common/commons';
import { BoardTable } from "database/tables";
interface SureListResponse {
	body: string;
	isRedirected: boolean;
	redirectedUrl: string;
}

export class NichanSureListClient {
	public static async fetchSures(board: BoardTable): Promise<SureListResponse> {
		const url = `http://${board.subDomain}.${board.domain}/${board.path}/subject.txt`;
		const res = await xhrRequest({
			url: url,
		});
		return {
			body: sjisBufferToStr(res.body),
			isRedirected: res.responseURL !== url,
			redirectedUrl: res.responseURL
		};
	}
}