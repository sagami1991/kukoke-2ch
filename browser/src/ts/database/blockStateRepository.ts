import { PanelType } from '../tofu/tofuDefs';
import { PanelBlockState } from './tables';
import { db } from "database/database";

class BlockStateRepository {
	public async getState(panelType: PanelType) {
		const state = await db.panelStates.get(panelType);
		if (state) {
			return state.blockState;
		}
	}
	public getStates() {
		return db.panelStates.toArray();
	}

	public putState(blockState: PanelBlockState) {
		return db.panelStates.put(blockState);
	}

}

export const blockStateRepository = new BlockStateRepository();