import { getSvgIcon, TIconName, TIconSize } from 'common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
export interface ButtonOption extends ComponentOption {
	readonly label?: string;
	readonly icon: TIconName;
	readonly iconSize?: TIconSize;
	readonly style?: "icon-only" | "normal";
	readonly onClick: () => void;
	readonly subLabel?: string;
}


export class Button extends BaseComponent<ButtonOption> {
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
}