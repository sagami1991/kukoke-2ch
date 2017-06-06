import { getSvgIcon, IconName, TemplateUtil } from 'common/commons';
import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
import { Popup } from "common/popup";
import { ElementUtil } from "common/element";
export interface MenuItem {
	readonly icon?: IconName;
	readonly label: string;
	readonly onSelect: () => void;
}
export interface MenuButtonOption extends ComponentOption {
	readonly items: MenuItem[];
}

interface MenuButtonGenerics extends ComponentGenerics {
	option: MenuButtonOption;
}

/** @deprecated 理由: electronのcontextmenu使えばいい */
export class MenuButton extends BaseComponent<MenuButtonGenerics> {
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
				${TemplateUtil.when(item.icon, () => `
					${getSvgIcon(item.icon!, "s")}
				`)}
				<div class="menu-label">${item.label}</div>
			</div>
		`;
	}

	private itemListTempl(items: MenuItem[]) {
		return `
			<div class="menu-items">
				${TemplateUtil.each(items, (item, i) => this.itemTempl(item, i))}
			</div>
		`;
	}

	/** @override */
	public initElem(element: HTMLElement, option: MenuButtonOption) {
		const items = option.items;
		const itemsElement = ElementUtil.createElement(this.itemListTempl(items));
		let popup: Popup;
		ElementUtil.addDelegateEventListener(itemsElement, "click", ".menu-item", (event, target) => {
			const index = target.getAttribute("index");
			if (index) {
				items[+index].onSelect();
				popup.close();
			}
		});
		element.addEventListener("click", () => {
			popup = new Popup({
				innerElement: itemsElement,
				target: element
			});
		});
	}
}