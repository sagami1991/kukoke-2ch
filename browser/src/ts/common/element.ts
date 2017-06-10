type ElementEventName = "click" | "change" | "contextmenu";
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

	export function createElements(html: string): HTMLElement[] {
		const container = document.createElement('div');
		container.innerHTML = html;
		const elements: HTMLElement[] = [];
		while (container.firstChild) {
			let element = container.firstChild;
			container.removeChild(element);
			elements.push(<HTMLElement>element);
		}
		return elements;
	}

	/** @deprecated */
	export function htmlParser(html: string): Document {
		const elem = new DOMParser().parseFromString(html, "text/html");
		if (elem instanceof HTMLUnknownElement) {
			throw new Error("パース失敗");
		}
		return elem;
	}

	export function addDelegateEventListener(elem: Element, eventName: ElementEventName, selector: string, cb: (event: Event, originalTarget: Element) => void) {
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

	export function removeChildren(container: HTMLElement) {
		while (container.firstChild) {
			container.removeChild(container.firstChild);
		}
	}

}