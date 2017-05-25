import { Panel } from '../panel/basePanel';
import { PanelType, BlockState } from './tofuDefs';
import { TofuShadow } from './tofuShadow';
import { TofuBlock } from './tofuBlock';
import remove from "lodash/remove";
import { createObserverId } from "base/observable";

export class TofuSheet {
	private readonly _el: HTMLDivElement;
	private readonly _shadow: TofuShadow;
	private readonly _blocks: TofuBlock[];
	// TODO まずい
	private _zIndex: number;

	constructor() {
		this._el = <HTMLDivElement> document.querySelector(".tofu-container")!;
		this._shadow = new TofuShadow();
		this._blocks = [];
		this._zIndex = 1;
	}


	public togglePanel(type: PanelType, panel: Panel) {
		// const target = remove(this._blocks, (block) => block. === type);
		// if (target[0]) {
		// 	// TODO 手前に
		// 	target[0].block._el.remove();
		// } else {
		// 	this.addBlock(type, panel);
		// }

	}

	public isOpenedPanel(panelType: PanelType): boolean {
		return this._blocks.find(block => block.panelType === panelType) ? true : false;
	}
	public async addBlock(panel: Panel) {
		const block = await this.createBlock(panel);
		this._el.appendChild(block.el);
		this._blocks.push(block);
	}
	public toFront(panelType: PanelType) {
		 this._blocks.find(block => block.panelType === panelType)!.changeZindex(this._zIndex++);
	}

	public init() {
		this._el.appendChild(this._shadow._el);
	}

	private async createBlock(panel: Panel) {
		const block = new TofuBlock(panel);
		await block.init();
		this.registerBlockEvent(block);
		return block;
	}

	private registerBlockEvent(block: TofuBlock) {
		block.el.addEventListener("click", () => {
			block.changeZindex(this._zIndex++);
		}, true);
		block.addListener("removed", createObserverId(), () => {
			remove(this._blocks, (tofu) => tofu === tofu);
		});
		const $block = $(block.el);
		$block.draggable({
			start: () => this.onTranceformStart(block),
			drag: (e, ui) => {
				block.calcPos({x: ui.position.left, y: ui.position.top, z: 0});
				this._shadow.changeCss(block.state);
			},
			stop: () => this.onTranceformStop(block),
			distance: 6,
			handle: ".tofu-top-bar"
		});

		$block.resizable({
			start: () => this.onTranceformStart(block),
			resize: (e, ui) => {
				block.calcSize({width: <number>ui.size.width, height: <number>ui.size.height});
				this._shadow.changeCss(block.state);
			},
			stop: () => this.onTranceformStop(block),
			distance: 10,
			handles: "e, s, se",
		});
	}
	private onTranceformStart(block: TofuBlock) {
		this._shadow.changeCss(block.state);
		this._shadow.show();
		block.onStart(this._zIndex++);
	}
	private onTranceformStop(block: TofuBlock) {
		this._shadow.hide();
		block.validateState({width: this._el.clientWidth, height: this._el.clientHeight});
		block.onStop();
	}
}