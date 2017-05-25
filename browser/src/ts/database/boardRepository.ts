import { BoardAttr } from './tables';
import { db } from "database/database";

class BoardRepository {
	public getBoard(domain: string, path: string) {
		return db.boards
			.where(["domain", "path"])
			.equals([domain, path])
			.first();
	}

	public getBoardsByKeys(keys: [string, string][]) {
		return db.boards
			.where(["domain", "path"])
			.anyOf(<any>keys)
			.toArray();
	}

	public getAllBoards() {
		return db.boards.toArray();
	}

	public getTempBoards() {
		return db.boards
			.where("isTemporary")
			.equals(1)
			.toArray();
	}

	public putBoard(board: BoardAttr) {
		return db.boards.put(board);
	}

	public async upsertBoards(boards: BoardAttr[]) {
		// TODO いい方法考える
		for (let board of boards) {
			const storedBoard = await db.boards.get([board.domain, board.path]);
			if (storedBoard) {
				await db.boards.update([board.domain, board.path], board);
			} else {
				await db.boards.add(board);
			}
		}
	}
}

export const boardRepository = new BoardRepository();