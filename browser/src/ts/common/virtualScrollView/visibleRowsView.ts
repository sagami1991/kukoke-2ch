import { ElementUtil } from "common/element";

interface Row {
	index: number;
	height: number;
	element: HTMLElement;
}

interface VisibleRowsViewOption {
	maxRowSize: number;
}

export class VisibleRowsView {
	private _el: HTMLElement;
	private _height: number;
	private _beginIndex: number;
	private _endIndex: number;
	private _justAddHeight: number;
	private _justRemoveHeight: number;
	private _maxRowSize: number;
	private map: Map<number, Row>;

	public get el(): HTMLElement {
		return this._el;
	}
	public get height(): number {
		return this._height;
	}
	public get beginIndex(): number {
		return this._beginIndex;
	}
	public get endIndex(): number {
		return this._endIndex;
	}
	public get justAddHeight(): number {
		return this._justAddHeight;
	}
	public get justRemoveHeight(): number {
		return this._justRemoveHeight;
	}
	public get maxRowSize(): number {
		return this._maxRowSize;
	}

	private template() {
		return `<div class="visible-rows-container "></div>`;
	}

	constructor(option: VisibleRowsViewOption) {
		this._el = ElementUtil.createElement(this.template());
		this._height =  0;
		this._beginIndex = 0;
		this._endIndex = 0;
		this.map = new Map();
		this._justAddHeight = 0;
		this._justRemoveHeight = 0;
		this._maxRowSize = option.maxRowSize;
	}

	public getTopRow(offset: number): number | null {
		if (this.map.size === 0) {
			return null;
		}
		let height = 0;
		for (let i = this._beginIndex; i <= this._endIndex; i++) {
			height += this.map.get(i)!.height;
			if (offset < height) {
				return i;
			}
		}
		return null;

	}

	public getBottomRow(offsetPlusClient: number): number | null {
		if (this.map.size === 0) {
			return null;
		}
		const bottom = this._height - offsetPlusClient;
		let height = 0;
		for (let i = this._endIndex; i >= this._beginIndex; i--) {
			height += this.map.get(i)!.height;
			if (bottom < height) {
				return i;
			}
		}
		return null;
	}

	public render(startIndex: number, allItem: HTMLElement[]) {
		if (allItem.length === 0) {
			return;
		}
		this._beginIndex =  Math.max(startIndex, 0);
		this._endIndex = Math.min(startIndex + this._maxRowSize, allItem.length - 1);
		this._height = 0;
		this._justAddHeight = 0;
		this._justRemoveHeight = 0;
		for (let i = this._endIndex; i >= this._beginIndex; i--) {
			this.insertRow(i, allItem[i]);
		}

		for (let i = 0; i < this._beginIndex; i++) {
			this.removeRow(i);
		}

		for (let i = this._endIndex + 1 ; i < allItem.length; i ++) {
			this.removeRow(i);
		}
	}

	private insertRow(i: number, element: HTMLElement) {
		if (this.map.get(i)) {
			this._height += this.map.get(i)!.height;
			return;
		}
		if (element.parentElement) {
			return;
		}
		const afterElement = this.rowAfter(i);
		if (afterElement === null) {
			this._el.appendChild(element);
		} else {
			this._el.insertBefore(element, afterElement);
		}
		const itemHeight = element.offsetHeight;
		const row: Row = {
			index: i,
			height: itemHeight,
			element: element,
		};
		this.map.set(i, row);
		this._height += itemHeight;
		this._justAddHeight += itemHeight;
	}

	private removeRow(index: number) {
		const row = this.map.get(index);
		if (row && row.element.parentElement) {
			this._justRemoveHeight += row.height;
			this._el.removeChild(row.element);
			this.map.delete(index);
		}
	}

	private rowAfter(index: number): HTMLElement | null {
		const row = this.map.get(index + 1);
		if (row === undefined) {
			return null;
		} else {
			return row.element;
		}
	}
}