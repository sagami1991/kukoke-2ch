import { alertMessage } from '../common/utils';
import { getSvgIcon, MyIcon, MyIconSize } from '../common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
import { tmpl } from "common/tmpl";
import { Popup } from "common/popup";
import { ElemUtil } from "common/element";
export interface MenuItem {
	readonly icon?: MyIcon;
	readonly label: string;
	readonly onSelect: () => void;
}
export interface MenuButtonOption extends ComponentOption {
	readonly items: MenuItem[];
}

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
				${tmpl.when(item.icon, () => `
					${getSvgIcon(item.icon!, "s")}
				`)}
				<div class="menu-label">${item.label}</div>
			</div>
		`;
	}

	private itemListTempl(items: MenuItem[]) {
		return `
			<div class="menu-items">
				${tmpl.each(items, (item, i) => this.itemTempl(item, i))}
			</div>
		`;
	}

	/** @override */
	public initElem(elem: Element, option: MenuButtonOption) {
		const items = option.items;
		const itemsElem = ElemUtil.parseDom(this.itemListTempl(items));
		let popup: Popup;
		ElemUtil.addDelegateEventListener(itemsElem, "click", ".menu-item", (event, target) => {
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