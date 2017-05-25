import { BaseComponent, ComponentOption } from './baseComponent';
import { _ } from "../commons/libs";
import { ElemUtil } from "../commons/element";
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
	public static scanHtml(html: string) {
		const outerElem = ElemUtil.parseDom(html);
		this.scan(outerElem);
		return outerElem;
	}

	public static scan(outerElem: Element) {
		const elems = outerElem.querySelectorAll(".my-component");
		if (elems.length === 0) {
			// throw new Error("Component not found");
		}
		for (const elem of elems) {
			const id = elem.getAttribute("component-id");
			if (!id) {
				throw new Error("予期せぬエラー component-idが存在しない");
			}
			const elemId = +id;
			const componentSet = _.remove(this.components, set => set.component._id === elemId)[0];
			if (!componentSet) {
				throw new Error("すでにスキャン済み");
			}
			componentSet.component.preInitElem(elem);
			componentSet.component.initElem(elem, componentSet.option);
		}
	}
}