import { ElementUtil } from "common/element";

export class ZIndexManager {
	private static zIndex = 100000;
	private static overlayElement = ElementUtil.createElement(`<div class="popup-overlay"></div>`);
	public static open() {
		this.zIndex ++;
	}

	public static close() {
		this.zIndex --;
	}
}