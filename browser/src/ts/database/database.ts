import { PanelType } from '../tofu/tofuDefs';
import Dexie from "dexie";
import { SureAttr, BoardAttr, PanelBlockState} from "database/tables";
import { CONSTS } from "const";

class Database extends Dexie {
	public readonly sures:  Dexie.Table<SureAttr, [string, string, number]>;
	public readonly boards:  Dexie.Table<BoardAttr, [string, string]>;
	public readonly panelStates: Dexie.Table<PanelBlockState, PanelType>;
	constructor() {
		super("kukoke", {
			autoOpen: false
		});
		this.version(1).stores({
			boards: "[domain+path], *isTemporary",
			sures: "[bDomain+bPath+datNo], [bDomain+bPath+saved], *isTemporary"
		});

		this.version(2).stores({
			panelStates: "panelType"
		});

		this.version(3).stores({
			sures: "[bDomain+bPath+datNo], [bDomain+bPath], [bDomain+bPath+saved], *isTemporary"
		});

		this.version(4).stores({
			sures: "[bDomain+bPath+datNo], [bDomain+bPath], [bDomain+bPath+saved], [bDomain+bPath+enabled], *isTemporary"
		});
	}

	public async initQuery() {
		await this.transaction("rw", this.panelStates, async () => {
			for (let panelState of CONSTS.DEFAULT_TOFU_STATES) {
				const storedState = await this.panelStates.get(panelState.panelType);
				if (!storedState) {
					await this.panelStates.add(panelState);
				}
			}
		});

	}
}
export const db = new Database();

