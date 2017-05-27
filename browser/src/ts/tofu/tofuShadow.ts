import { BlockState, BlockPosition, BlockSize } from './tofuDefs';
import { ElemUtil } from "../common/element";

// TODO 継承
export class TofuShadow {
	public readonly _el: HTMLDivElement;
	public readonly _position: BlockPosition;
	public readonly _size: BlockSize;

	private static template() {
		return `<div class="tofu-shadow"></div>`;
	}

	constructor() {
		this._el = <HTMLDivElement>ElemUtil.parseDom(TofuShadow.template());
		this._position = { x: 0, y: 0, z: 0 };
		this._size = { width: 0, height: 0 };
		this.hide();
		this.applyCss();
	}

	public show() {
		this._el.style.display = "";
	}

	public hide() {
		this._el.style.display = "none";
	}

	public changeCss(option: BlockState) {
		if (option.position.x !== this._position.x ||
			option.position.y !== this._position.y ||
			option.size.width !== this._size.width ||
			option.size.height !== this._size.height
		) {
			this._position.x = option.position.x;
			this._position.y = option.position.y;
			this._size.width = option.size.width;
			this._size.height = option.size.height;
			this.applyCss();
		}
	}

	private applyCss() {
		this._el.style.left = this._position.x + "px";
		this._el.style.top = this._position.y + "px";
		this._el.style.width = this._size.width + "px";
		this._el.style.height = this._size.height + "px";
	}
}