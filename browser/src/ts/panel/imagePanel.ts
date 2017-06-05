import { contextMenuController } from '../common/contextmenu';
import { ComponentScanner } from 'component/scanner';
import { Panel, PanelType } from './basePanel';
import { ImageClient } from "client/imageClient";

export class ImageViewerPanel extends Panel {
	private container: HTMLElement;
	private imageClient: ImageClient | undefined;
	public get panelType(): PanelType {
		return "image";
	}

	// components
	private template() {
		return `
		<div class="panel-container panel-image">
			<div class="panel-content">
				<div class="image-container normal">
				</div>
			</div>
		</div>
		`;
	}

	constructor() {
		super();
		this._title = "画像";
		this._el = ComponentScanner.scanHtml(this.template());
		this.container = <HTMLElement>this._el.querySelector(".image-container")!;
		this.container.addEventListener("click", () => {
			this.container.classList.toggle("normal");
			this.container.classList.toggle("zoomed");
		});
		this.container.addEventListener("contextmenu", () => {
			if (this.imageClient) {
				contextMenuController.addMenu(this.imageClient.getImageContextMenu(() => {}));
			}
		});
	}

	public async openImage(url: string) {
		this.imageClient = ImageClient.createInstance(url);
		const model = await this.imageClient.getSavedImage();
		if (model === null) {
			return;
		}
		this.container.innerHTML = `<img src="${model.filePath}" />`;

	}

	protected getStorageForSave() { return {}; };
	protected getDefaultStorage() { return {}; };
	public canClose() {
		return true;
	}

}