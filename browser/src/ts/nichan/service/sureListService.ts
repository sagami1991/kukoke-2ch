import { SureAttr, BoardAttr } from 'database/tables';
import { sureRepository } from "database/sureRepository";
import { SureModel } from 'nichan/model/sureModel';
import { NichanSureListClient } from "nichan/client/nichanSureListClient";
import { db } from "database/database";

class SureListService {
	public async fetchSureCollectionFromDb(board: BoardAttr): Promise<SureModel[]> {
		const sureAttrs = await sureRepository.getEnableSuresByBoard(board.domain, board.path);
		return this.toCollection(sureAttrs, board);
	}

	public async fetchSureCollection(board: BoardAttr): Promise<SureModel[]> {
		const html = await NichanSureListClient.fetchSures(board);
		const fetchedSures = this.htmlToSureAttrList(html, board);
		const sureAttrs = await db.transaction("rw", db.sures, async () => {
			await sureRepository.deleteNotSavedSureByBoard(board.domain, board.path);
			await sureRepository.disableSureByBoard(board.domain, board.path);
			await sureRepository.upsertAllSure(fetchedSures);
			return await sureRepository.getEnableSuresByBoard(board.domain, board.path);
		}).catch(e => {
			console.error(e);
			throw e;
		});
		return this.toCollection(sureAttrs, board);
	}


	private htmlToSureAttrList(html: string, board: BoardAttr) {
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
				index: index,
				bDomain: board.domain,
				bPath: board.path,
				datNo: +result[0].replace(".dat", ""),
				displayName: result[2].replace(/(\s\[無断転載禁止\])?(&#169;2ch\.net)/, ""),
				resCount: resCount,
				enabled: 1,
				saved: 0,
			});
		});
		return sures;
	}

	private toCollection(sures: SureAttr[], board: BoardAttr) {
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