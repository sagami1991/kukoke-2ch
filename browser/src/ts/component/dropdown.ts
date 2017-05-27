import { alertMessage } from '../common/utils';
import { getSvgIcon, MyIcon, MyIconSize } from '../common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
import { tmpl } from "common/tmpl";
export interface DropdownItem {
	readonly icon?: MyIcon;
	readonly label: string;
}
export interface DropdownOption extends ComponentOption {
	readonly defaultItem: DropdownItem;
	readonly items: DropdownItem[];
	readonly onSelect: () => void;
}

export class Dropdown extends BaseComponent<DropdownOption> {
	/** @override */
	public html() {
		return `
		<div 
			class="my-dropdown-component ${this.getClassNames()}"
			${this.htmlAttr()}
		>
			<div class="dropdown-item">
				${tmpl.when(this.option!.defaultItem.icon, () => `
					${getSvgIcon(this.option!.defaultItem.icon!, "s")}
				`)}
				<div class="dropdown-label">${this.option!.defaultItem.label}</div>

			</div>
			${getSvgIcon("icon-arrow-dropdown", "m")}
		</div>
		`;
	}

	/** @override */
	public initElem(elem: Element, option: DropdownOption) {
		elem.addEventListener("click", () => alertMessage("error", "未実装"));
	}
}