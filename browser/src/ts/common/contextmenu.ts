

import { electron } from "common/libs";

class ContextMenuController {
	private menus: Electron.MenuItemOptions[];
	private commonMenuMode: "visible" | "hidden";
	constructor() {
		this.commonMenuMode = "visible";
		this.menus = [];
		window.addEventListener("contextmenu", () => {
			this.menus.push(...this.commonMenuItems());
			const menu = electron.Menu.buildFromTemplate(this.menus);
			menu.popup();
			this.commonMenuMode = "visible";
			this.menus = [];
		});
	}

	public addMenu(menus: Electron.MenuItemOptions[]) {
		this.menus.push(...menus);
	}

	public hideCommonMenu() {
		this.commonMenuMode = "hidden";
	}

	private commonMenuItems(): Electron.MenuItemOptions[] {
		return [];
	}
}

export const contextMenuController = new ContextMenuController();