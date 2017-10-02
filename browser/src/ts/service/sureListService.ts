import { boardRepository } from '../database/boardRepository';
import { notify, _ } from '../common/libs';
import { SureTable, SureAttr, BoardTable } from 'database/tables';
import { sureRepository } from "database/sureRepository";
import { SureModel } from 'model/sureModel';
import { NichanSureListClient } from "client/nichanSureListClient";
import { db } from "database/database";

class SureListService {
	public async getSuresFromDb(board: BoardTable): Promise<SureModel[]> {
		const sureAttrs = await sureRepository.getEnableSuresByBoard(board.id);
		return this.toModels(sureAttrs, board);
	}

	public async getRecentOpenSures() {
		const sureAttrs = await sureRepository.getRecentOpenSures();
		const bIds = _.uniq(sureAttrs.map(sure => sure.bId));
		const boards = await boardRepository.getBoardsByIds(bIds);
		const boardMap = new Map(boards.map<[number, BoardTable]>(board => [board.id, board]));
		const sureModels: SureModel[] = [];
		sureAttrs.forEach(attr => {
			const board = boardMap.get(attr.bId);
			if (board) {
				sureModels.push(new SureModel(attr, board));
			} else {
				console.info("板テーブルに存在しないスレを飛ばしました:" + attr);
			}
		});
		return sureModels;
	}

	public async getSuresFromNichan(board: BoardTable): Promise<SureModel[]> {
		const response = await NichanSureListClient.fetchSures(board);
		const sureAttrsFromNichan = this.htmlToSureAttrs(response.body, board);
		const sureAttrsFromDb = await db.transaction("rw", [db.sures, db.boards], async () => {
			if (response.isRedirected) {
				const array = response.redirectedUrl.match(/https?:\/\/(.+?)\./);
				const subDomain = array && array[1];
				if (subDomain) {
					board.subDomain = subDomain;
					await boardRepository.putBoard(board);
					notify.info("板移転を確認");
				}
			}
			await sureRepository.deleteNotSavedSureByBoard(board.id);
			await sureRepository.disableSureByBoard(board.id);
			await sureRepository.upsertAllSure(sureAttrsFromNichan);
			return await sureRepository.getEnableSuresByBoard(board.id);
		});
		// TODO キャッシュから読み込んでも200番が返ってくるので304判定できない
		notify.success("スレ一覧取得完了");
		return this.toModels(sureAttrsFromDb, board);
	}


	private htmlToSureAttrs(html: string, board: BoardTable): SureAttr[] {
		const sures: SureAttr[] = [];
		html.split("\n").forEach((row, index) => {
			const result = row.split(/(<>|\t\s)/);
			if (result.length < 5) {
				return;
			}
			const resCountMatcher = result[4].match(/\(([0-9]{0,9})\)/);
			const resCount = resCountMatcher ? +resCountMatcher[1] : null;
			if (!resCount) {
				return;
			}
			sures.push({
				bId: board.id,
				datNo: +result[0].replace(".dat", ""),
				index: index,
				displayName: result[2].replace(/(\s\[無断転載禁止\])?(&#169;[2,5]ch\.net)/, ""),
				resCount: resCount,
				enabled: 1,
				saved: 0,
			});
		});
		return sures;
	}

	private toModels(sures: SureTable[], board: BoardTable) {
		const models: SureModel[] = [];
		let ikioiAve = 0;
		sures.forEach(attr => {
			const sureModel = new SureModel(attr, board);
			models.push(sureModel);
			ikioiAve += sureModel.ikioi;
		});
		ikioiAve = ikioiAve / sures.length;
		models.forEach(model => {
			model.setIkioiColor(ikioiAve);
		});
		return models;
	}
}

export const sureListService = new SureListService();