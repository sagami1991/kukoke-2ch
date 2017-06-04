import { getSvgIcon, MyIcon, templateUtil } from 'common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
import { Popup } from "common/popup";
import { ElementUtil } from "common/element";
export interface MenuItem {
	readonly icon?: MyIcon;
	readonly label: string;
	readonly onSelect: () => void;
}
export interface MenuButtonOption extends ComponentOption {
	readonly items: MenuItem[];
}

/** @deprecated 理由: electronのcontextmenu使えばいい */
export class MenuButton extends BaseComponent<MenuButtonOption> {
	/** @override */
	public html() {
		return `
		<div 
			class="menu-button-component ${this.getClassNames()}"
			${this.htmlAttr()}
		>
			${getSvgIcon("icon-menu")}
		</div>
		`;
	}

	private itemTempl(item: MenuItem, index: number) {
		return `
			<div class="menu-item" index="${index}">
				${templateUtil.when(item.icon, () => `
					${getSvgIcon(item.icon!, "s")}
				`)}
				<div class="menu-label">${item.label}</div>
			</div>
		`;
	}

	private itemListTempl(items: MenuItem[]) {
		return `
			<div class="menu-items">
				${templateUtil.each(items, (item, i) => this.itemTempl(item, i))}
			</div>
		`;
	}

	/** @override */
	public initElem(elem: Element, option: MenuButtonOption) {
		const items = option.items;
		const itemsElem = ElementUtil.createElement(this.itemListTempl(items));
		let popup: Popup;
		ElementUtil.addDelegateEventListener(itemsElem, "click", ".menu-item", (event, target) => {
			const index = target.getAttribute("index");
			if (index) {
				items[+index].onSelect();
				popup.close();
			}
		});
		elem.addEventListener("click", () => {
			popup = new Popup(itemsElem, elem);
		});
	}
}