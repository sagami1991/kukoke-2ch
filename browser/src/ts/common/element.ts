export namespace ElementUtil {
	export const appContainer = document.querySelector(".app-container")!;

	export function createElement(html: string): HTMLElement {
		const container = document.createElement('div');
		container.innerHTML = html;
		if (container.childElementCount !== 1) {
			throw new Error(`childElementの数が不正: ${container.childElementCount}`);
		}
		const element = container.firstElementChild!;
		container.removeChild(element);
		return <HTMLElement>element;
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