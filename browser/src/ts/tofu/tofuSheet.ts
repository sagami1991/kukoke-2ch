import { Panel, PanelType } from 'panel/basePanel';
import { TofuShadow } from './tofuShadow';
import { TofuBlock } from './tofuBlock';
import { _ } from "common/libs";
import { createObserverId } from "base/observable";

export class TofuSheet {
	private readonly _el: HTMLDivElement;
	private readonly _shadow: TofuShadow;
	private readonly _blocks: TofuBlock[];
	private _zIndex: number;
	private _frontBlock: PanelType | undefined;

	constructor() {
		this._el = <HTMLDivElement> document.querySelector(".tofu-container")!;
		this._shadow = new TofuShadow();
		this._blocks = [];
		this._zIndex = 1;
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
		if (this._frontBlock !== panelType) {
			const block = this._blocks.find(block => block.panelType === panelType);
			block!.changeZindex(this._zIndex++); // TODO null時処理
			this._frontBlock = block!.panelType;
		}
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
			this.toFront(block.panelType);
		}, true);
		block.addListener("removed", createObserverId(), () => {
			_.remove(this._blocks, (tofu) => tofu === tofu);
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
		block.onStart();
		this.toFront(block.panelType);
	}

	private onTranceformStop(block: TofuBlock) {
		this._shadow.hide();
		block.validateState({width: this._el.clientWidth, height: this._el.clientHeight});
		block.onStop();
	}
}