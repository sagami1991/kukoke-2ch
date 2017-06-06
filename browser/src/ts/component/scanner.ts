import { BaseComponent, ComponentOption } from './baseComponent';
import { _ } from "../common/libs";
import { ElementUtil } from "../common/element";
export class ComponentScanner {
	private static components: {
		component: BaseComponent,
		option: ComponentOption
	}[] = [];
	private static id: number = 0;

	public static register(component: BaseComponent, option: ComponentOption) {
		this.components.push({ component: component, option: option });
		this.id++;
		return this.id;
	}

	public static scanHtml(html: string): HTMLElement {
		const outerElem = ElementUtil.createElement(html);
		this.scan(outerElem);
		return outerElem;
	}

	public static scanHtmls(html: string): HTMLElement[] {
		const container = document.createElement('div');
		container.innerHTML = html;
		this.scan(container);
		const elements: HTMLElement[] = [];
		while (container.firstChild) {
			const element = container.firstChild;
			container.removeChild(element);
			elements.push(<HTMLElement>element);
		}
		return elements;
	}

	public static scan(outerElem: HTMLElement) {
		const elements = outerElem.querySelectorAll(".my-component");
		if (elements.length === 0) {
			// throw new Error("Component not found");
		}
		for (const element of elements) {
			const id = element.getAttribute("component-id");
			if (!id) {
				throw new Error("予期せぬエラー component-idが存在しない");
			}
			const elemId = +id;
			const componentSet = _.remove(this.components, set => set.component._id === elemId)[0];
			if (!componentSet) {
				throw new Error("すでにスキャン済み");
			}
			componentSet.component.preInitElem(<HTMLElement>element);
			componentSet.component.initElem(<HTMLElement>element, componentSet.option);
		}
	}
}