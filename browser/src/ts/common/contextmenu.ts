import { electron } from "common/libs";

class ContextMenuController {
	private menus: Electron.MenuItemOptions[];
	private commonMenuMode: "visible" | "hidden";
	private callBack: (() => void) | null;
	constructor() {
		this.commonMenuMode = "visible";
		this.menus = [];
		this.callBack = null;
		window.addEventListener("contextmenu", (e) => {
			this.menus.push(...this.commonMenuItems(<HTMLElement> e.target));
			if (this.menus.length > 0) {
				if (this.menus[this.menus.length - 1].type === "separator") {
					this.menus.pop();
				}
				setTimeout(() => {
					this.popupMenu(this.menus);
					this.menus = [];
					if (this.callBack) {
						this.callBack();
						this.callBack = null;
					}
				}, 0);
			}
			this.commonMenuMode = "visible";
		});
	}

	public popupMenu(menus: Electron.MenuItemOptions[]) {
		electron.Menu.buildFromTemplate(menus).popup();
	}

	public addMenu(menus: Electron.MenuItemOptions[]) {
		this.menus.push(...menus, { type: "separator" });
	}

	public setCallBack(callBack: () => void) {
		this.callBack =	callBack;
	}

	public hideCommonMenu() {
		this.commonMenuMode = "hidden";
	}

	private commonMenuItems(target: HTMLElement): Electron.MenuItemOptions[] {
		const isInput = target.matches("textarea,input");
		if (isInput) {
			return [
				{
					label: "切り取り",
					role: "cut"
				}, {
					label: "コピー",
					role: "copy"
				}, {
					label: "貼り付け",
					role: "paste"
				}
			];
		}
		const selectedText = window.getSelection().toString();
		if (selectedText) {
			return [
				{
					label: "コピー",
					role: "copy"
				}, {
					label: "選択単語をGoogle検索",
					click: () => {
						electron.shell.openExternal(`http://www.google.co.jp/search?lr=lang_ja&q=${encodeURIComponent(selectedText)}`);
					}
				}
			];
		}

		return [];
	}
}

export const contextMenuController = new ContextMenuController();