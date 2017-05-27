import { tmpl } from '../common/commons';
import { BaseComponent, ComponentOption } from './baseComponent';
export interface TextareaOption extends ComponentOption {
	initValue?: string;
}

export class Textarea extends BaseComponent<TextareaOption, HTMLTextAreaElement> {
	/** @override */
	public html() {
		return `
			<textarea 
				class="my-radio-component ${super.getClassNames()}"
				${super.htmlAttr()}
			>
			</textarea>
		`;
	}

	/** @override */
	public initElem(elem: HTMLTextAreaElement, option: TextareaOption) {
		elem.value = option.initValue || "";
	}

	public setValue(value: string) {
		this.elem.value = value;
	}

	public getValue() {
		return this.elem.value;
	}
}