import { Panel, PanelType } from 'panel/basePanel';
import { TofuShadow } from './tofuShadow';
import { TofuBlock } from './tofuBlock';
import { createObserverId } from "base/observable";

export class TofuSheet {
	private readonly el: HTMLDivElement;
	private readonly shadow: TofuShadow;
	private readonly blockMap: Map<PanelType, TofuBlock>;
	private readonly observerId: string;
	private zIndex: number;
	private frontBlock: PanelType | undefined;

	constructor() {
		this.el = <HTMLDivElement> document.querySelector(".tofu-container")!;
		this.shadow = new TofuShadow();
		this.blockMap = new Map();
		this.zIndex = 1;
		this.observerId = createObserverId();
	}

	public isOpenedPanel(panelType: PanelType): boolean {
		return this.blockMap.get(panelType) ? true : false;
	}

	public async addBlock(panel: Panel) {
		const block = await this.createBlock(panel);
		this.el.appendChild(block.el);
		this.blockMap.set(panel.panelType, block);
	}

	public closeBlock(panelType: PanelType) {
		const block = this.blockMap.get(panelType);
		if (block) {
			this.blockMap.delete(panelType);
			this.el.removeChild(block.el);
			block.disposeObserve(this.observerId);
			block.onClose();
		}
	}

	public toFront(panelType: PanelType) {
		if (this.frontBlock !== panelType) {
			const block = this.blockMap.get(panelType);
			block!.changeZindex(this.zIndex++); // TODO null時処理
			this.frontBlock = block!.panelType;
		}
	}


	public init() {
		this.el.appendChild(this.shadow.el);
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
		block.addListener("close", this.observerId, () => {
			this.closeBlock(block.panelType);
		});
		const $block = $(block.el);
		$block.draggable({
			start: () => this.onTranceformStart(block),
			drag: (e, ui) => {
				block.calcPos({x: ui.position.left, y: ui.position.top, z: 0});
				this.shadow.changeCss(block.state);
			},
			stop: () => this.onTranceformStop(block),
			distance: 6,
			handle: ".tofu-top-bar"
		});

		$block.resizable({
			start: () => this.onTranceformStart(block),
			resize: (e, ui) => {
				block.calcSize({width: <number>ui.size.width, height: <number>ui.size.height});
				this.shadow.changeCss(block.state);
			},
			stop: () => this.onTranceformStop(block),
			distance: 10,
			handles: "e, s, se",
		});
	}

	private onTranceformStart(block: TofuBlock) {
		this.shadow.changeCss(block.state);
		this.shadow.show();
		block.onStart();
		this.toFront(block.panelType);
	}

	private onTranceformStop(block: TofuBlock) {
		this.shadow.hide();
		block.validateState({width: this.el.clientWidth, height: this.el.clientHeight});
		block.onStop();
	}
}