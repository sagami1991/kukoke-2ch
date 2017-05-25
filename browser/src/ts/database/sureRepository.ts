import { SureAttr } from './tables';
import { db } from "./database";

class SureRepository {
	public getSure(bDomain: string, bPath: string, datNo: number) {
		return db.sures
			.where(["bDomain", "bPath", "datNo"])
			.equals([bDomain, bPath, datNo])
			.first();
	}

	public async getEnableSuresByBoard(bDomain: string, bPath: string, ) {
		return await db.sures
			 .where(["bDomain", "bPath", "enabled"])
			 .equals([bDomain, bPath, 1])
			 .sortBy("index"); // メモ: インデックス使用でのソートではない
	}

	public deleteNotSavedSureByBoard(bDomain: string, bPath: string) {
		return db.sures
			.where(["bDomain", "bPath", "saved"])
			.equals([bDomain, bPath, 0])
			.delete();
	}

	public disableSureByBoard(bDomain: string, bPath: string) {
		return db.sures
			.where(["bDomain", "bPath", "enabled"])
			.equals([bDomain, bPath, 1])
			.modify({enabled: 0});
	}

	public upsertSure(sure: SureAttr) {
		return db.sures.put(sure);
	}

	public async upsertAllSure(sures: SureAttr[]) {
		// TODO いい方法考える
		for (let sure of sures) {
			const saved = await db.sures.get([sure.bDomain, sure.bPath, sure.datNo]);
			if (saved) {
				await db.sures.update([sure.bDomain, sure.bPath, sure.datNo], {
					index: sure.index,
					resCount: sure.resCount,
					enabled: sure.enabled
				});
			} else {
				await db.sures.add(sure);

			}
		}
	}
}

export const sureRepository = new SureRepository();