import {VisibleRowsView} from "./visibleRowsView";
import { ElementUtil } from "common/commons";

export interface VirtualScrillViewOption {
	readonly parent: HTMLElement;
	readonly rowElements: HTMLElement[];
	readonly minRowHeight: number;
	readonly initIndex: number;
}

export class VirtualScrollView {
	private visibleRowsView: VisibleRowsView;

	private offsetHeight: number;
	private clientHeight: number;
	private sliderHeight: number;
	private allRowElements: HTMLElement[];
	private readonly minRowHeight: number;

	// elememts
	private readonly parent: HTMLElement;
	private readonly container: HTMLElement;
	private readonly verticalScrollBar: HTMLElement;
	private readonly slider: HTMLElement;
	private template() {
		return `
			<div class="virtual-list-container"></div>
			<div class="virtual-list-scroll-bar">
				<div class="virtual-list-slider"></div>
			</div>
		`;
	}
	constructor(option: VirtualScrillViewOption) {
		this.parent = option.parent;
		this.parent.innerHTML = this.template();
		this.container = <HTMLElement> this.parent.querySelector(".virtual-list-container");
		this.verticalScrollBar = <HTMLElement> option.parent.querySelector(".virtual-list-scroll-bar");
		this.slider = <HTMLElement> option.parent.querySelector(".virtual-list-slider");
		this.minRowHeight = option.minRowHeight;
		this.parent.addEventListener("wheel", (e) => {
			this.onScroll(e.deltaY * 0.5);
		}, <any>{passive: true});
		$(this.slider).draggable({
			axis: "y",
			containment: "parent",
			drag: (event, draggableEvent) => {
				this.onSliderMove(draggableEvent);
			},
			stop: (event: MouseEvent, draggableEvent) => {
				this.onSliderMove(draggableEvent);
			}
		});
		this.verticalScrollBar.addEventListener("click", (e) => {
			this.moveY(e.layerY);
		});
		this.init(option.rowElements, option.initIndex, 0);

	}

	private onSliderMove(draggableEvent: JQueryUI.DraggableEventUIParams) {
		let y = draggableEvent.position.top;
		if (y > (this.clientHeight / 2)) {
			y += this.sliderHeight;
		}
		this.moveY(y);
	}

	private init(items: HTMLElement[], startIndex: number, offsetHeight: number) {
		this.clientHeight = this.parent.clientHeight;
		const maxVisibleRowSize = Math.ceil(this.clientHeight / this.minRowHeight);
		if (this.visibleRowsView) {
			this.container.removeChild(this.visibleRowsView.el);
		}
		this.visibleRowsView = new VisibleRowsView({
			maxRowSize: maxVisibleRowSize
		});
		this.container.appendChild(this.visibleRowsView.el);
		this.allRowElements = items;
		this.offsetHeight = offsetHeight;
		this.sliderHeight = this.clientHeight / this.allRowElements.length * this.clientHeight / this.minRowHeight;
		this.sliderHeight = Math.min(this.clientHeight, this.sliderHeight);
		this.sliderHeight = Math.max(30, this.sliderHeight);
		this.slider.style.height = this.sliderHeight + "px";
		this.visibleRowsView.render(startIndex, this.allRowElements);
		this.applyOffsetHeight();
	}

	public empty() {
		this.changeContents([]);
	}
	public changeContentsWithKeep (items: HTMLElement[]) {
		this.init(items,  this.visibleRowsView.beginIndex, this.offsetHeight);
	}
	public changeContents(items: HTMLElement[], index?: number) {
		this.init(items, index || 0, 0);
	}
	public getNowIndex() {
		const top = this.visibleRowsView.getTopRow(this.offsetHeight);
		return top || 0;
	}

	public changeParentSize() {
		ElementUtil.removeChildren(this.visibleRowsView.el);
		this.init(this.allRowElements, this.visibleRowsView.beginIndex, this.offsetHeight);
	}

	private moveY(layerY: number) {
		let index = Math.ceil(this.allRowElements.length * layerY / this.clientHeight);
		this.moveIndex(index);
	}

	private moveIndex(index: number) {
		if (index < 0) {
			index = 0;
		} else if (index >= this.allRowElements.length) {
			index = this.allRowElements.length - 1;
		}
		this.visibleRowsView.render(index, this.allRowElements);
		this.offsetHeight = 0;
		this.applyOffsetHeight();
	}


	private onScroll(deltaY: number) {
		this.offsetHeight += deltaY;
		const allHeight = this.offsetHeight + this.clientHeight;
		// when scroll down
		scrollScope: if (deltaY > 0 && allHeight > this.visibleRowsView.height) {
			if (this.visibleRowsView.endIndex === this.allRowElements.length - 1 ) {
				this.offsetHeight = this.visibleRowsView.height - this.clientHeight;
				break scrollScope;
			}
			const begin = this.visibleRowsView.getTopRow(this.offsetHeight);
			if (begin !== null) {
				this.visibleRowsView.render(begin, this.allRowElements);
				this.offsetHeight -= this.visibleRowsView.justRemoveHeight;
			}
		// when scroll up
		} else if (deltaY < 0 && this.offsetHeight < 0) {
			if (this.visibleRowsView.beginIndex === 0) {
				this.offsetHeight = 0;
				break scrollScope;
			}
			const end = this.visibleRowsView.getBottomRow(this.offsetHeight + this.clientHeight);
			if (end !== null) {
				this.visibleRowsView.render(end - this.visibleRowsView.maxRowSize, this.allRowElements);
				this.offsetHeight += this.visibleRowsView.justAddHeight;
			}
		}
		this.applyOffsetHeight();
	}

	private applyOffsetHeight() {
		this.visibleRowsView.el.style.top = (- this.offsetHeight) + "px";
		this.changeSliderStyle();
	}

	private changeSliderStyle() {
		const begin = this.visibleRowsView.getTopRow(this.offsetHeight);
		if (begin !== null) {
			let top = this.clientHeight * (begin / this.allRowElements.length);
			top = Math.min(top, this.clientHeight - this.sliderHeight);
			this.slider.style.top = top + "px";

		}
	}

}