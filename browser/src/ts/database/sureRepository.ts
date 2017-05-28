import { SureTable, SureAttr } from './tables';
import { db } from "./database";

class SureRepository {
	public getSure(id: number): Promise<SureTable> {
		return db.sures.get(id);
	}

	private getSureByDatNo(bId: number, datNo: number): Promise<SureTable> {
		return db.sures
			.where(["bId", "datNo"])
			.equals([bId, datNo])
			.first();
	}

	public getEnableSuresByBoard(bId: number): Promise<SureTable[]> {
		return db.sures
			 .where(["bId", "enabled"])
			 .equals([bId, 1])
			 .sortBy("index"); // メモ: インデックス使用でのソートではない
	}

	public async getRecentOpenSures(): Promise<SureTable[]> {
		const sures = await db.sures
		.where("isTemporary")
		.equals(1)
		.toArray();
		return sures.sort((bef, af) => bef.updatedAt > af.updatedAt ? -1 : 1);
	}

	public deleteSure(id: number): Promise<void> {
		return db.sures.delete(id);
	}

	public deleteNotSavedSureByBoard(bId: number): Promise<number> {
		return db.sures
			.where(["bId", "saved"])
			.equals([bId, 0])
			.delete();
	}

	public disableSureByBoard(bId: number): Promise<number> {
		return db.sures
			.where(["bId", "enabled"])
			.equals([bId, 1])
			.modify({
				enabled: 0
			});
	}

	public putSure(sure: SureTable): Promise<number> {
		sure.updatedAt = new Date();
		return db.sures.put(sure);
	}

	public async upsertAllSure(sures: SureAttr[]): Promise<void> {
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