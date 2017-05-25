import { PanelBlockState } from "database/tables";

export namespace CONSTS {
	export const DEFAULT_TOFU_STATES: PanelBlockState[] = [
		{
			panelType: "board",
			blockState: {
				position: { x: 0, y: 0, z: 0 },
				size: { width: 120, height: 420 }
			}
		},
		{
			panelType: "sure",
			blockState: {
				position: { x: 120, y: 0, z: 0 },
				size: { width: 630, height: 420 }
			}
		},
		{
			panelType: "res",
			blockState: {
				position: { x: 0, y: 420, z: 0 },
				size: { width: 750, height: 480 }
			}
		},
	]
}