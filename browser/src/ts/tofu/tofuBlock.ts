import { createObserverId, Observable } from 'base/observable';
import { ComponentScanner } from 'component/scanner';
import { Button, ButtonOption } from 'component/components';
import { Panel, PanelType } from 'panel/basePanel';
import { BlockPosition, BlockSize, BlockState } from './tofuDefs';
import { blockStateRepository } from "database/blockStateRepository";
import { db } from "database/database";
import { emojiUtil } from "common/emoji";
interface BlockEvent {
	removed: undefined;
}
export class TofuBlock extends Observable<BlockEvent> {
	private readonly _el: HTMLElement;
	private readonly _titleElem: Element;
	private _position: BlockPosition;
	private _size: BlockSize;
	private readonly _unitX: number;
	private readonly _unitY: number;
	private _observerId: string;

	// compoinents
	private readonly _closeButton: Button;
	private readonly _maximizeButton: Button;
	public get el() {
		return this._el;
	}
	public get panelType(): PanelType {
		return this._panel.panelType;
	}
	public get state(): BlockState {
		return {
			position: this._position,
			size: this._size
		};
	}
	private template() {
		return `
			<div class="tofu-panel">
				<div class="tofu-top-bar">
					<div class="tofu-title">
						${emojiUtil.replace(this._panel.title)}
					</div>
					${this._maximizeButton.html()}
					${this._closeButton.html()}
				</div>
				<div class="panel-outer-container"></div>
				<div class="tofu-resizable-bar ui-resizable-e"></div>
				<div class="tofu-resizable-bar ui-resizable-s"></div>
				<div class="tofu-resizable-bar ui-resizable-se"></div>
			</div>
		`;
	}

	constructor(private readonly _panel: Panel) {
		super();
		this._closeButton = new Button(this.getCloseButtonOption());
		this._maximizeButton = new Button(this.getMaximizeButtonOption());
		this._el = ComponentScanner.scanHtml(this.template());
		this._titleElem = this._el.querySelector(".tofu-title")!;
		this._unitX = 30;
		this._unitY = 30;
		this._observerId = createObserverId();
		this._panel.addListener("changeTitle", this._observerId, (title) => {
			// TODO xss確認
			this._titleElem.innerHTML = emojiUtil.replace(title);
		});

	}

	public async init() {
		let state = await blockStateRepository.getState(this._panel.panelType);
		if (!state) {
			state = {
				position: {x: 120, y: 90, z: 0},
				size: {width: 300, height: 300}
			};
		}
		this._position = state.position;
		this._size = state.size;
		this.applyCss();
		this._el.querySelector(".panel-outer-container")!.appendChild(this._panel.el);
	}

	private getCloseButtonOption(): ButtonOption {
		return {
			className: "tofu-close tofu-header-button",
			icon: "icon-close",
			iconSize: "s",
			style: "icon-only",
			onClick: () => alert("未実装")//this.remove()
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
		this._position.x = Math.round(position.x / this._unitX) * this._unitX;
		this._position.y = Math.round(position.y / this._unitY) * this._unitY;
	}

	public calcSize(size: BlockSize) {
		this._size.width = Math.round(size.width / this._unitX) * this._unitX;
		this._size.height = Math.round(size.height / this._unitY) * this._unitY;
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
			position: { x: this._position.x, y: this._position.y, z: 0 },
			size: {	width: this._size.width, height: this._size.height }
		};
		if (kari.position.x < 0 ) {
			kari.position.x = 0;
		}
		if (kari.position.x > parentSize.width) {
			kari.position.x = parentSize.width - this._unitX;
		}
		if (kari.position.y < 0) {
			kari.position.y = 0;
		}
		if (kari.position.y > parentSize.height) {
			kari.position.y = parentSize.height - this._unitY;
		}
		if (kari.size.width + kari.position.x > parentSize.width) {
			kari.size.width = parentSize.width - kari.position.x;
		}
		if (kari.size.width < this._unitX) {
			kari.size.width = this._unitX;
		}
		if (kari.size.height + kari.position.y > parentSize.height) {
			kari.size.height = parentSize.height - kari.position.y;
		}
		if (kari.size.height < this._unitY) {
			kari.size.height = this._unitY;
		}

		this.calcPos(kari.position);
		this.calcSize(kari.size);
	}

	private remove() {
		this._el.remove();
		this.trigger("removed", undefined);
		this._panel.removeListener(this._observerId);
	}

	private maximize() {
		alert("未実装");
	}

	/** 自分のプロパティの値をstyleに反映 */
	private applyCss() {
		this._el.style.left = this._position.x + "px";
		this._el.style.top = this._position.y + "px";
		this._el.style.width = this._size.width + "px";
		this._el.style.height = this._size.height + "px";
	}


}