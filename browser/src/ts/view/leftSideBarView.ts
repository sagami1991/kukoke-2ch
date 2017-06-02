import { ElementUtil, getSvgIcon, alertMessage } from "../common/commons";

export type TofuType = "board" | "sureList" | "resList";
export class LeftSideBarView {
	private readonly _el: Element;
	private static template() {
		return `
		<div class="side-line" panel="board">
			${getSvgIcon("icon-assignment")}
			<div class="side-line-text">板</div>
		</div>
		<div class="side-line" panel="sure">
			${getSvgIcon("icon-toc")}
			<div class="side-line-text">スレ</div>
		</div>
		<div class="side-line" panel="res">
			${getSvgIcon("icon-comment")}
			<div class="side-line-text">レス</div>
		</div>
		`;
	}

	constructor() {
		this._el = document.querySelector(".side-bar-container")!;
		this._el.innerHTML = LeftSideBarView.template();
		ElementUtil.addDelegateEventListener(this._el, "click", ".side-line", (e, target) => {
			alertMessage("info", "未実装");
		});
	}
}