import { contextMenuController } from '../common/contextmenu';
import { createObserverId } from '../base/observable';
import { ImageClient, ImageModel } from '../client/imageClient';
import { BaseComponent, ComponentOption } from './baseComponent';
import { templateUtil } from "common/commons";
export interface ImageOption extends ComponentOption {
	readonly url: string;
}


export class ImageThumbnail extends BaseComponent<ImageOption> {
	private obserberId: string;
	private imageModel: ImageModel | null;
	/** @override */
	public html() {
		return `
		<div 
			class="image-component ${super.getClassNames()}"
			${super.htmlAttr()}
		>
		</div>
		`;
	}

	/** @override */
	public async initElem(element: HTMLElement, option: ImageOption) {
		this.obserberId = createObserverId();
		element.textContent = "未取得";
		const instance = ImageClient.createInstance(option.url);
		this.imageModel = await instance.getSavedImage();
		if (this.imageModel) {
			this.appendImage(element, this.imageModel);
		}
		instance.addListener("done", this.obserberId, (imageModel) => {
			this.imageModel = imageModel;
			this.appendImage(element, imageModel);
		});
		instance.addListener("progress", this.obserberId, ([loaded, total]) => {
			element.textContent = `取得中... ${templateUtil.kbFormat(loaded)} / ${templateUtil.kbFormat(total)}`;
		});
		instance.addListener("abort", this.obserberId, (reason) => {
			element.textContent = `キャンセルされました 理由: ${reason}`;
		});
		instance.addListener("error", this.obserberId, (reason) => {
			element.textContent = `エラー 理由: ${reason}`;
		});
		element.addEventListener("click", () => {
			if (instance.status === "noRequest") {
				instance.getImage(false);
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
					contextMenuController.addMenu([
						{
							label: "画像を削除",
							click: async () => {
								await instance.delete();
								element.textContent = "未取得";
							}
						}, {
							label: "エクスプローラで開く",
							click: () => instance.openFolder()
						}
					]);
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
				<img src=${model.thumbnailPath} />
				<div class="image-info">${templateUtil.kbFormat(model.byteLength)} ${model.width}x${model.height}</div>
			</div>`;
	}
}