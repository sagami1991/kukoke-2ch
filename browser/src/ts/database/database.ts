import { ImageTable } from './tables';
import { TPanelType } from 'panel/basePanel';
import Dexie from "dexie";
import { SureTable, BoardTable, PanelBlockStateTable} from "database/tables";
import { Consts } from "const";

class Database extends Dexie {
	public readonly sures:  Dexie.Table<SureTable, number>;
	public readonly boards:  Dexie.Table<BoardTable, number>;
	public readonly panelStates: Dexie.Table<PanelBlockStateTable, TPanelType>;
	public readonly images: Dexie.Table<ImageTable, number>;

	constructor() {
		super("kukoke", {
			autoOpen: false
		});

		this.version(1).stores({
			boards: "++id, &[domain+path], *isTemporary",
			sures: "++id, &[bId+datNo], [bId], [bId+saved], [bId+enabled], *isTemporary",
			panelStates: "panelType"
		});

		this.version(2).stores({
			images: "++id, &url"
		});
	}

	public async initQuery() {
		await this.transaction("rw", this.panelStates, this.sures, async () => {
			for (let panelState of Consts.DEFAULT_TOFU_STATES) {
				const storedState = await this.panelStates.get(panelState.panelType);
				if (!storedState) {
					await this.panelStates.add(panelState);
				}
			}
		});

	}
}
export const db = new Database();

