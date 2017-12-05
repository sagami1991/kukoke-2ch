import { getSvgIcon, IconName, TemplateUtil } from 'common/commons';
import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
import { Popup } from "common/popup";
import { ElementUtil } from "common/element";
export interface DropdownItem<T = string> {
	readonly icon?: IconName;
	readonly label: string;
	readonly id?: T;
}
export interface DropdownOption<T = string> extends ComponentOption {
	readonly defaultItem: T;
	readonly items: DropdownItem<T>[];
	readonly onSelect: (itemId: T) => void;
	readonly width?: number;
}
interface DropdownGenerics<T> extends ComponentGenerics {
	option: DropdownOption<T>;
	element: HTMLInputElement;
}
export class Dropdown<T extends string = string> extends BaseComponent<DropdownGenerics<T>> {
	private readonly items: DropdownItem<T>[];
	private readonly width: number;

	constructor(option: DropdownOption<T>) {
		super(option);
		this.items = option.items;
		this.width = option.width || 150;
	}

	/** @override */
	public html() {
		return `
		<div 
			class="my-dropdown-component ${this.getClassNames()}"
			${this.htmlAttr()}
			style="width:${this.width}px"
		>
			${this.dropdownDefaultTemplate(this.option!.defaultItem)}
		</div>
		`;
	}

	private dropdownDefaultTemplate(id: T) {
		return `
			${this.itemTemplate(this.items.find(item => item.id === id)!, 0)}
			${getSvgIcon("icon-arrow-dropdown", "m", "dropdown-icon")}
		`;
	}

	private itemTemplate(item: DropdownItem, i: number) {
		return `
			<div class="dropdown-item" id="${item.id ? item.id : i}">
				${TemplateUtil.when(item.icon, () => `
					${getSvgIcon(item.icon!, "s")}
				`)}
				<div class="dropdown-label">${TemplateUtil.escape(item.label)}</div>
			</div>
		`;
	}

	private itemListTemplate(items: DropdownItem[], option: DropdownOption) {
		return `
			<div class="dropdown-items" style="width:${this.width}px">
				${TemplateUtil.each(items, (item, i) => this.itemTemplate(item, i))}
			</div>
		`;
	}

	/** @override */
	public initElem(element: HTMLElement, option: DropdownOption<T>) {
		const {items, onSelect} = option;
		const itemsElement = ElementUtil.createElement(this.itemListTemplate(items, option));
		let popup: Popup;
		ElementUtil.addDelegateEventListener(itemsElement, "click", ".dropdown-item", (event, target) => {
			const itemId = target.getAttribute("id");
			if (itemId) {
				onSelect(<T>itemId);
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

	public changeItem(id: T) {
		this.element.innerHTML = this.dropdownDefaultTemplate(id);
	}
}