import { TemplateUtil } from '../common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
import { ElementUtil } from "../common/element";
export interface RadioButtonOption<T extends string> extends ComponentOption {
	items: { label: string, value: T }[];
	initValue: T;
	onChangeValue: (value: T) => void;
}

export class RadioButton<T extends string> extends BaseComponent<RadioButtonOption<T>> {
	/** @override */
	public html() {
		return `
			<div 
				class="my-radio-component ${super.getClassNames()}"
				${super.htmlAttr()}
			>
				${TemplateUtil.each(this.option!.items, (item) => `
					<div
						class="my-radio-item"
						value="${item.value}"
					>
						<div class="my-radio-mark"></div>
						<div class="my-radio-label">${item.label}</div>
					</div>
				`)}
			</div>
		`;
	}

	/** @override */
	public initElem(elem: HTMLElement, option: RadioButtonOption<T>) {
		const initItem = elem.querySelector(`[value=${option.initValue}]`);
		if (initItem) {
			initItem.classList.add("my-radio-checked");
		}
		ElementUtil.addDelegateEventListener(elem, "click", ".my-radio-item", (event, target) => {
			const value = <T>target.getAttribute("value");
			const elems = elem.querySelectorAll(".my-radio-item");
			for (const elem of elems) {
				elem.classList.toggle("my-radio-checked", elem === target);
			}
			option.onChangeValue(value);
		});
	}
}