import { ElementUtil } from "common/element";

interface PopupOption {
	innerElement: HTMLElement;
	target: Element;
}
export class Popup {
	private static popups: Popup[] | undefined;
	private readonly popupElement: HTMLElement;
	private readonly overlayElem: Element;

	private template() {
		return `<div class="popup"></div>`;
	}

	private overlay() {
		return `<div class="popup-overlay"></div>`;
	}

	constructor(option: PopupOption) {
		this.popupElement = ElementUtil.createElement(this.template());
		const rect = option.target.getBoundingClientRect();
		const bottom = ElementUtil.appContainer.clientHeight - rect.bottom;
		if (rect.top > bottom) {
			this.popupElement.style.bottom = bottom + 8 + "px";
			this.popupElement.style.maxHeight = `calc(100% - ${bottom + 8}px)`;
		} else {
			const top = rect.top + rect.height;
			this.popupElement.style.top = top + "px";
			this.popupElement.style.maxHeight = `calc(100% - ${top + 8}px)`;

		}
		this.popupElement.style.left = rect.left + "px";
		this.overlayElem = ElementUtil.createElement(this.overlay());
		this.popupElement.appendChild(option.innerElement);

		if (!Popup.popups) {
			ElementUtil.appContainer.appendChild(this.overlayElem);
			this.overlayElem.addEventListener("click", () => {
				this.close();
			});
			Popup.popups = [this];
		} else {
			Popup.popups.push(this);
		}
		ElementUtil.appContainer.appendChild(this.popupElement);
		const popupRect = this.popupElement.getBoundingClientRect();
		if (popupRect.left < 0) {
			this.popupElement.style.left = "0px";
			this.popupElement.style.right = "";
		} else if (popupRect.right > window.innerWidth) {
			this.popupElement.style.left = "";
			this.popupElement.style.right = "0px";
		}
	}

	public close() {
		if (Popup.popups) {
			const popups = Popup.popups;
			Popup.popups = undefined;
			popups.forEach(popup => {
				popup.close();
			});
		}
		this.popupElement.remove();
		this.overlayElem.remove();
	}

}