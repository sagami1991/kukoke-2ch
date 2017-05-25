import { boardRepository } from '../../database/boardRepository';
import { db } from '../../database/database';
import { ElemUtil } from 'commons/commons';
import { BbsMenuClient } from "nichan/client/nichanBbsmenuClient";
import { BoardAttr } from "database/tables";

class BbsMenuService {
	public addHistory(board: BoardAttr) {
		board.isTemporary = 1;
		return boardRepository.putBoard(board);
	}

	public getBoardsHistories() {
		return boardRepository.getTempBoards();
	}

	public getAllBoardsFromDb() {
		return boardRepository.getAllBoards();
	}

	public async getBoardsFromServer() {
		const html = await BbsMenuClient.fetchBoards();
		const boards = this.htmlToBoards(html);
		await db.transaction("rw", db.boards, async () => {
			await boardRepository.upsertBoards(boards);
		});
		return boards;
	}

	private htmlToBoards(resBody: string) {
		const boards: BoardAttr[] = [];
		const aElems = ElemUtil.htmlParser(resBody).querySelectorAll("a");
		for (const elem of aElems) {
			const href = elem.getAttribute("href");
			if (href === null) {
				continue;
			}
			const displayName = elem.innerText;
			const result = href.match(/http:\/\/(.+?)\.(.+?)\/(.+?)\/?$/);
			if (displayName && result) {
				boards.push({
					domain: result[2],
					path: result[3],
					subDomain: result[1],
					displayName: displayName
				});
			}
		}
		return boards;
	}
}

export const bbsMenuService = new BbsMenuService();