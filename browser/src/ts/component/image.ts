import { contextMenuController } from '../common/contextmenu';
import { createObserverId } from '../base/observable';
import { ImageClient } from '../client/imageClient';
import { BaseComponent, ComponentOption, ComponentGenerics } from './baseComponent';
import { TemplateUtil } from "common/commons";
import { ImageModel } from "model/imageModel";
export interface ImageOption extends ComponentOption {
	readonly url: string;
}

interface ImageThumbnailEvent {
	"openImage": string;
}
export interface ComponentGeneric {
	option: ComponentOption;
	element: HTMLElement;
	event: {};
}

interface ImageGenerics extends ComponentGenerics {
	option: ImageOption;
	event: ImageThumbnailEvent;
}

export class ImageThumbnail extends BaseComponent<ImageGenerics> {
	private obserberId: string;
	/** @override */
	public html() {
		return `
		<div class="image-component ${super.getClassNames()}" ${super.htmlAttr()}>
		</div>
		`;
	}

	/** @override */
	public async initElem(element: HTMLElement, option: ImageOption) {
		this.obserberId = createObserverId();
		element.textContent = "未取得";
		const instance = ImageClient.createInstance(option.url);
		const imageModel = await instance.getSavedImage();
		if (imageModel) {
			this.appendImage(element, imageModel);
		}
		instance.addListener("done", this.obserberId, (imageModel) => {
			this.appendImage(element, imageModel);
		});
		instance.addListener("progress", this.obserberId, ([loaded, total]) => {
			element.innerText = `取得中... \n${TemplateUtil.kbFormat(loaded)} / ${TemplateUtil.kbFormat(total)}`;
		});
		instance.addListener("abort", this.obserberId, (reason) => {
			element.textContent = `キャンセルされました 理由: ${reason}`;
		});
		instance.addListener("error", this.obserberId, (reason) => {
			element.textContent = `エラー 理由: ${reason}`;
		});
		element.addEventListener("click", () => {
			switch (instance.status) {
				case "noRequest":
					instance.getImage(false);
					element.textContent = "取得準備中...";
					break;
				case "done":
					this.trigger("openImage", option.url);
					break;
			}
		});
		element.addEventListener("contextmenu", () => {
			switch (instance.status) {
				case "noRequest":
					return;
				case "requesting":
					contextMenuController.addMenu([{
						label: "キャンセル",
						click: () => instance.cancel("キャンセル実行")
					}]);
					break;
				case "done":
					contextMenuController.addMenu(instance.getImageContextMenu(() => element.textContent = "未取得"));
			}
		});
		element.addEventListener("DOMNodeRemoved", (e) => {
			if (e.target === element) {
				instance.disposeObserve(this.obserberId);
			}
		});
	}

	private appendImage(outerElem: HTMLElement, model: ImageModel) {
		outerElem.innerHTML = `
			<div class="image-container">
				<img src="${model.thumbnailPath}" />
				<div class="image-info">${TemplateUtil.kbFormat(model.byteLength)} ${model.width}x${model.height}</div>
			</div>`;
	}
}