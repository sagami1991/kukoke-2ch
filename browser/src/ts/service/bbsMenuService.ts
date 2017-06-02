import { boardRepository } from 'database/boardRepository';
import { db } from 'database/database';
import { ElementUtil } from 'common/commons';
import { NichanBbsMenuClient } from "client/nichanBbsmenuClient";
import { BoardTable, BoardAttr } from "database/tables";

class BbsMenuService {
	public addHistory(board: BoardTable) {
		board.isTemporary = 1;
		return boardRepository.putBoard(board);
	}

	public getBoardsHistories() {
		return boardRepository.getTempBoards();
	}

	public getAllBoardsFromDb() {
		return boardRepository.getAllBoards();
	}

	public async getBoardsFromNichan(): Promise<BoardTable[]> {
		const html = await NichanBbsMenuClient.fetchBoards();
		const boards = this.htmlToBoards(html);
		return await db.transaction("rw", db.boards, async () => {
			await boardRepository.upsertBoards(boards);
			return await boardRepository.getAllBoards();
		});
	}

	private htmlToBoards(resBody: string): BoardAttr[] {
		const boards: BoardAttr[] = [];
		const aElems = ElementUtil.htmlParser(resBody).querySelectorAll("a");
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