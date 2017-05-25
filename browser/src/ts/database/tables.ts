import { PanelType, BlockState } from "tofu/tofuDefs";

/** 
 * 主キー（domain, path）
 */
export interface BoardAttr {
	domain: string;
	path: string;
	displayName: string;
	subDomain: string;
	isTemporary?: 0 | 1;
}

/**
 * 主キー (bDomain, bPath, datNo)
 * インデックス (bDomain, bPath) // TODO 複合キーの途中までインデックスなしで走査する方法
 * インデックス (bDomain, bPath, saved)
 * インデックス (bDomain, bPath, enabled)
 * インデックス (isTemporary)
 */
export interface SureAttr {
	bDomain: string;
	bPath: string;
	datNo: number;
	index?: number;
	displayName: string;
	resCount: number;
	savedResCount?: number;
	enabled: 0 | 1;
	saved?: 0 | 1;
	isTemporary?: 0 | 1;
	byteLength?: number;
	lastModified?: string;
	// TODO 更新日時
}

/**
 * 主キー（id）オートインクリメント
 * インデックス（url）プライマリ
 */
export interface ImageAttr {
	id?: number;
	url: string;
}

/**
 * 主キー（panelType）
 */
export interface PanelBlockState {
	panelType: PanelType;
	blockState: BlockState;
}