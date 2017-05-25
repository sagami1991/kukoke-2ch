export namespace ElemUtil {
	export const appElem = document.querySelector(".app-container")!;
	export function empty(parent: Element) {
		parent.innerHTML = "";
	}

	export function parseDom(html: string): HTMLElement {
		const outer = document.createElement('div');
		outer.innerHTML = html;
		if (outer.childElementCount !== 1) {
			throw new Error(`childElementの数が不正: ${outer.childElementCount}`);
		}
		const elem = <HTMLElement>outer.firstElementChild!;
		return elem;
	}

	/** @deprecated */
	export function htmlParser(html: string): Document {
		const elem = new DOMParser().parseFromString(html, "text/html");
		if (elem instanceof HTMLUnknownElement) {
			throw new Error("パース失敗");
		}
		return elem;
	}

	export function addDelegateEventListener(elem: Element, eventName: "click" | "change", selector: string, cb: (event: Event, originalTarget: Element) => void) {
		elem.addEventListener(eventName, (event) => {
			let target = <Element>event.target;
			while (target && target !== event.currentTarget) {
				if (target.matches(selector)) {
					cb(event, target);
					break;
				}
				target = target.parentElement!;
			}

		});
	}

}