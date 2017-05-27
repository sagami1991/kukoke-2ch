import { SureTable, SureAttr } from './tables';
import { db } from "./database";

class SureRepository {
	public getSure(id: number) {
		return db.sures.get(id);
	}

	public getSureByDatNo(bId: number, datNo: number) {
		return db.sures
			.where(["bId", "datNo"])
			.equals([bId, datNo])
			.first();
	}

	public async getEnableSuresByBoard(bId: number) {
		return await db.sures
			 .where(["bId", "enabled"])
			 .equals([bId, 1])
			 .sortBy("index"); // メモ: インデックス使用でのソートではない
	}

	public deleteNotSavedSureByBoard(bId: number) {
		return db.sures
			.where(["bId", "saved"])
			.equals([bId, 0])
			.delete();
	}

	public disableSureByBoard(bId: number) {
		return db.sures
			.where(["bId", "enabled"])
			.equals([bId, 1])
			.modify({enabled: 0});
	}

	public upsertSure(sure: SureTable) {
		return db.sures.put(sure);
	}

	public async upsertAllSure(sures: SureAttr[]) {
		// TODO いい方法考える
		for (let sure of sures) {
			const saved = await this.getSureByDatNo(sure.bId, sure.datNo);
			if (saved) {
				await db.sures.update(saved.id, {
					index: sure.index,
					resCount: sure.resCount,
					enabled: sure.enabled
				});
			} else {
				await db.sures.add(<SureTable>sure);
			}
		}
	}
}

export const sureRepository = new SureRepository();