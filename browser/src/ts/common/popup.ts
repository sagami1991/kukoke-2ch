import { ElemUtil } from "common/element";

export class Popup {
	private static popups: Popup[] | undefined;
	private readonly popupElem: HTMLElement;
	private readonly overlayElem: Element;

	private teml() {
		return `<div class="popup"></div>`;
	}

	private overlay() {
		return `<div class="popup-overlay"></div>`;
	}

	constructor(elem: Element, target: Element) {
		this.popupElem = ElemUtil.parseDom(this.teml());
		const rect = target.getBoundingClientRect();
		const bottom = ElemUtil.appElem.clientHeight - rect.bottom;
		if (rect.top > bottom) {
			this.popupElem.style.bottom = bottom + 8 + "px";
			this.popupElem.style.maxHeight = `calc(100% - ${bottom + 8}px)`;
		} else {
			this.popupElem.style.top = rect.top + "px";
			this.popupElem.style.maxHeight = `calc(100% - ${rect.top + 8}px)`;

		}
		this.popupElem.style.left = rect.left + "px";
		this.overlayElem = ElemUtil.parseDom(this.overlay());
		this.popupElem.appendChild(elem);
		if (!Popup.popups) {
			ElemUtil.appElem.appendChild(this.overlayElem);
			this.overlayElem.addEventListener("click", () => {
				this.close();
			});
			Popup.popups = [this];
		} else {
			Popup.popups.push(this);
		}
		ElemUtil.appElem.appendChild(this.popupElem);
	}

	public close() {
		if (Popup.popups) {
			const popups = Popup.popups;
			Popup.popups = undefined;
			popups.forEach(popup => {
				popup.close();
			});
		}
		this.popupElem.remove();
		this.overlayElem.remove();
	}

}