export interface BlockState {
	position: BlockPosition;
	size: BlockSize;
}

export interface BlockPosition {
	x: number;
	y: number;
	z: number;
}

export interface BlockSize {
	width: number;
	height: number;
}

export type PanelType = "board" | "sure" | "res" | "form";