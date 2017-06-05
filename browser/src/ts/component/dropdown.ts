import { getSvgIcon, TIconName, TemplateUtil } from 'common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
import { Popup } from "common/popup";
import { ElementUtil } from "common/element";
export interface DropdownItem<T = string> {
	readonly icon?: TIconName;
	readonly label: string;
	readonly id?: T;
}
export interface DropdownOption<T = string> extends ComponentOption {
	readonly defaultItem: DropdownItem;
	readonly items: DropdownItem<T>[];
	readonly onSelect: (itemId: T) => void;
}

export class Dropdown extends BaseComponent<DropdownOption> {
	/** @override */
	public html() {
		return `
		<div 
			class="my-dropdown-component ${this.getClassNames()}"
			${this.htmlAttr()}
		>
			${this.itemTempl(this.option!.defaultItem, 0)}
			${getSvgIcon("icon-arrow-dropdown", "m")}
		</div>
		`;
	}

	private itemTempl(item: DropdownItem, i: number) {
		return `
			<div class="dropdown-item" id="${item.id ? item.id : i}">
				${TemplateUtil.when(item.icon, () => `
					${getSvgIcon(item.icon!, "s")}
				`)}
				<div class="dropdown-label">${item.label}</div>

			</div>
		`;
	}

	private itemListTempl(items: DropdownItem[]) {
		return `
			<div class="dropdown-items">
				${TemplateUtil.each(items, (item, i) => this.itemTempl(item, i))}
			</div>
		`;
	}

	/** @override */
	public initElem(elem: HTMLElement, option: DropdownOption) {
		const {items, onSelect} = option;
		const itemsElem = ElementUtil.createElement(this.itemListTempl(items));
		let popup: Popup;
		ElementUtil.addDelegateEventListener(itemsElem, "click", ".dropdown-item", (event, target) => {
			const itemId = target.getAttribute("id");
			if (itemId) {
				onSelect(itemId);
				popup.close();
			}
		});
		elem.addEventListener("click", () => {
			popup = new Popup(itemsElem, elem);
		});
	}
}