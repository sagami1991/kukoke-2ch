import { BlockState, BlockPosition, BlockSize } from './tofuDefs';
import { ElementUtil } from "../common/element";

// TODO 継承
export class TofuShadow {
	public readonly el: HTMLDivElement;
	public readonly position: BlockPosition;
	public readonly size: BlockSize;

	private static template() {
		return `<div class="tofu-shadow"></div>`;
	}

	constructor() {
		this.el = <HTMLDivElement>ElementUtil.createElement(TofuShadow.template());
		this.position = { x: 0, y: 0, z: 0 };
		this.size = { width: 0, height: 0 };
		this.hide();
		this.applyCss();
	}

	public show() {
		this.el.style.display = "";
	}

	public hide() {
		this.el.style.display = "all";
	}

	public changeCss(option: BlockState) {
		if (option.position.x !== this.position.x ||
			option.position.y !== this.position.y ||
			option.size.width !== this.size.width ||
			option.size.height !== this.size.height
		) {
			this.position.x = option.position.x;
			this.position.y = option.position.y;
			this.size.width = option.size.width;
			this.size.height = option.size.height;
			this.applyCss();
		}
	}

	private applyCss() {
		this.el.style.left = this.position.x + "px";
		this.el.style.top = this.position.y + "px";
		this.el.style.width = this.size.width + "px";
		this.el.style.height = this.size.height + "px";
	}
}