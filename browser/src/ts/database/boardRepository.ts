import { BoardTable, BoardAttr } from './tables';
import { db } from "database/database";

class BoardRepository {
	public getBoard(id: number) {
		return db.boards.get(id);
	}

	public getAllBoards() {
		return db.boards.toArray();
	}

	private getBoardByDomainAndPath(domain: string, path: string) {
		return db.boards
			.where(["domain", "path"])
			.equals([domain, path])
			.first();
	}

	public getBoardsByIds(ids: number[]) {
		return db.boards
			.where("id")
			.anyOf(ids)
			.toArray();
	}


	public getTempBoards() {
		return db.boards
			.where("isTemporary")
			.equals(1)
			.toArray();
	}

	public putBoard(board: BoardTable) {
		return db.boards.put(board);
	}

	public async upsertBoards(boards: BoardAttr[]) {
		// TODO いい方法考える
		for (let board of boards) {
			const boardFromDb = await this.getBoardByDomainAndPath(board.domain, board.path);
			if (boardFromDb) {
				await db.boards.update(boardFromDb.id, board);
			} else {
				await db.boards.add(<BoardTable>board);
			}
		}
	}
}

export const boardRepository = new BoardRepository();