import { createObserverId, Observable } from 'base/observable';
import { ComponentScanner } from 'component/scanner';
import { Button, ButtonOption } from 'component/components';
import { Panel, TPanelType } from 'panel/basePanel';
import { BlockPosition, BlockSize, BlockState } from './tofuDefs';
import { blockStateRepository } from "database/blockStateRepository";
import { db } from "database/database";
import { emojiUtil } from "common/emoji";
interface BlockEvent {
	close: undefined;
}
export class TofuBlock extends Observable<BlockEvent> {
	private readonly panel: Panel;
	private position: BlockPosition;
	private size: BlockSize;
	private readonly unitX: number;
	private readonly unitY: number;
	private observerId: string;

	// elements and compoinents
	private readonly _el: HTMLElement;
	private readonly titleContainer: HTMLElement;
	private readonly panelContainer: HTMLElement;
	private readonly closeButton: Button;
	private readonly maximizeButton: Button;
	public get el() {
		return this._el;
	}
	public get panelType(): TPanelType {
		return this.panel.panelType;
	}
	public get state(): BlockState {
		return {
			position: this.position,
			size: this.size
		};
	}
	private template() {
		return `
			<div class="tofu-block">
				<div class="tofu-top-bar">
					<div class="tofu-title">
						${emojiUtil.replace(this.panel.title)}
					</div>
					${this.maximizeButton.html()}
					${this.closeButton.html()}
				</div>
				<div class="panel-outer-container"></div>
				<div class="tofu-resizable-bar ui-resizable-e"></div>
				<div class="tofu-resizable-bar ui-resizable-s"></div>
				<div class="tofu-resizable-bar ui-resizable-se"></div>
			</div>
		`;
	}

	constructor(panel: Panel) {
		super();
		this.panel = panel;
		this.closeButton = new Button(this.getCloseButtonOption());
		this.maximizeButton = new Button(this.getMaximizeButtonOption());
		this._el = ComponentScanner.scanHtml(this.template());
		this.titleContainer = <HTMLElement> this._el.querySelector(".tofu-title");
		this.panelContainer = <HTMLElement> this._el.querySelector(".panel-outer-container");
		this.unitX = 30;
		this.unitY = 30;
		this.observerId = createObserverId();
		this.panel.addListener("changeTitle", this.observerId, (title) => {
			this.titleContainer.innerHTML = emojiUtil.replace(title); // TODO xss確認
		});

	}

	public async init() {
		let state = await blockStateRepository.getState(this.panel.panelType);
		if (!state) {
			state = {
				position: {x: 120, y: 90, z: 0},
				size: {width: 300, height: 300}
			};
		}
		this.position = state.position;
		this.size = state.size;
		this.applyCss();
		this.panelContainer.appendChild(this.panel.el);
	}

	private getCloseButtonOption(): ButtonOption {
		return {
			className: "tofu-close tofu-header-button",
			icon: "icon-close",
			iconSize: "s",
			style: "icon-only",
			onClick: () => this.close()
		};
	}

	private getMaximizeButtonOption(): ButtonOption {
		return {
			className: "tofu-maximize tofu-header-button",
			icon: "icon-maximize",
			iconSize: "s",
			style: "icon-only",
			onClick: () => this.maximize()
		};
	}

	public calcPos(position: BlockPosition) {
		this.position.x = Math.round(position.x / this.unitX) * this.unitX;
		this.position.y = Math.round(position.y / this.unitY) * this.unitY;
	}

	public calcSize(size: BlockSize) {
		this.size.width = Math.round(size.width / this.unitX) * this.unitX;
		this.size.height = Math.round(size.height / this.unitY) * this.unitY;
	}

	public onStart() {
		this._el.classList.remove("tofu-stop");
	}

	public changeZindex(zIndex: number) {
		this._el.style.zIndex = "" + zIndex;
	}

	public onStop() {
		db.transaction("rw", db.panelStates, () => {
			blockStateRepository.putState({
				panelType: this.panelType,
				blockState: this.state,
			});
		});
		this._el.classList.add("tofu-stop");
		this.applyCss();
	}

	public validateState(parentSize: {width: number, height: number}) {
		let kari: BlockState = {
			position: { x: this.position.x, y: this.position.y, z: 0 },
			size: {	width: this.size.width, height: this.size.height }
		};
		if (kari.position.x < 0 ) {
			kari.position.x = 0;
		}
		if (kari.position.x > parentSize.width) {
			kari.position.x = parentSize.width - this.unitX;
		}
		if (kari.position.y < 0) {
			kari.position.y = 0;
		}
		if (kari.position.y > parentSize.height) {
			kari.position.y = parentSize.height - this.unitY;
		}
		if (kari.size.width + kari.position.x > parentSize.width) {
			kari.size.width = parentSize.width - kari.position.x;
		}
		if (kari.size.width < this.unitX) {
			kari.size.width = this.unitX;
		}
		if (kari.size.height + kari.position.y > parentSize.height) {
			kari.size.height = parentSize.height - kari.position.y;
		}
		if (kari.size.height < this.unitY) {
			kari.size.height = this.unitY;
		}

		this.calcPos(kari.position);
		this.calcSize(kari.size);
	}

	private close() {
		if (this.panel.canClose()) {
			this.trigger("close", undefined);
		}
	}

	public onClose() {
		this.panelContainer.removeChild(this.panel.el);
		this.panel.disposeObserve(this.observerId);
	}

	private maximize() {
		alert("未実装");
	}

	/** 自分のプロパティの値をstyleに反映 */
	private applyCss() {
		this._el.style.left = this.position.x + "px";
		this._el.style.top = this.position.y + "px";
		this._el.style.width = this.size.width + "px";
		this._el.style.height = this.size.height + "px";
	}


}