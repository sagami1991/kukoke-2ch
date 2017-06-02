import { ElementUtil } from "common/element";

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

	constructor(innerElem: Element, target: Element) {
		this.popupElem = ElementUtil.createElement(this.teml());
		const rect = target.getBoundingClientRect();
		const bottom = ElementUtil.appContainer.clientHeight - rect.bottom;
		if (rect.top > bottom) {
			this.popupElem.style.bottom = bottom + 8 + "px";
			this.popupElem.style.maxHeight = `calc(100% - ${bottom + 8}px)`;
		} else {
			const top = rect.top + rect.height;
			this.popupElem.style.top = top + "px";
			this.popupElem.style.maxHeight = `calc(100% - ${top + 8}px)`;

		}
		this.popupElem.style.left = rect.left + "px";
		this.overlayElem = ElementUtil.createElement(this.overlay());
		this.popupElem.appendChild(innerElem);
		if (!Popup.popups) {
			ElementUtil.appContainer.appendChild(this.overlayElem);
			this.overlayElem.addEventListener("click", () => {
				this.close();
			});
			Popup.popups = [this];
		} else {
			Popup.popups.push(this);
		}
		ElementUtil.appContainer.appendChild(this.popupElem);
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