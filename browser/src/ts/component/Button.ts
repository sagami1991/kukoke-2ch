import { getSvgIcon, IconName, IconSize } from 'common/commons';
import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
export interface ButtonOption extends ComponentOption {
	readonly label?: string;
	readonly icon: IconName;
	readonly iconSize?: IconSize;
	readonly style?: "icon-only" | "normal";
	readonly onClick: () => void;
	readonly subLabel?: string;
}

interface ButtonGenerics extends ComponentGenerics {
	option: ButtonOption;
	element: HTMLInputElement;
}

export class Button extends BaseComponent<ButtonGenerics> {
	/** @override */
	public html() {
		return `
		<button 
			class="my-button-component my-button-${this.option!.style || "normal"} ${this.getClassNames()}"
			${this.htmlAttr()}
		>
			${getSvgIcon(this.option!.icon, this.option!.iconSize)}
			<div class="my-button-labels">
				<div class="my-button-label-main">
					${this.option!.label || ""}
				</div>
				<div class="my-button-label-sub">
					${this.option!.subLabel || ""}
				</div>
			</div>
		</button>
		`;
	}

	/** @override */
	public initElem(elem: HTMLElement, option: ButtonOption) {
		elem.addEventListener("click", () => option.onClick());
	}

	public toggleActive(toggel: boolean) {
		this.element.classList.toggle("active", toggel);
	}
}