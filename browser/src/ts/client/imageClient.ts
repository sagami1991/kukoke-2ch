import { XhrRequestError } from '../common/error';
import { xhrRequest, XhrResponse } from '../common/request';
import { ImageTable, ImageType } from '../database/tables';
import { db } from '../database/database';
import { CancelablePromise } from '../common/promise';
import { Observable } from '../base/observable';
import { AppConstant } from "../../../../src/const";
import { Consts } from "const";
import { TemplateUtil, FileUtil } from "common/commons";
import { electron } from "common/libs";
import { ImageModel } from "model/imageModel";
import { imageRepository } from "database/imageRepository";

interface ImageClientEvent {
	"progress": [number, number];
	"done": ImageModel;
	"abort": string;
	"error": string;
}

const imageTypes: ImageType[] = ["image/png", "image/jpeg", "image/gif", "image/bmp"];

/** TODO クラス分け */
export class ImageClient extends Observable<ImageClientEvent> {
	private static clientMap: Map<string, ImageClient> = new Map();

	private readonly url: string;
	private xhrPromise: CancelablePromise<XhrResponse<Blob>> | null;
	private _status: "noRequest" | "done" | "requesting";
	private imageModel: ImageModel | undefined;
	public get status() {
		return this._status;
	}

	public static createInstance(url: string): ImageClient {
		if (this.clientMap.get(url) === undefined) {
			this.clientMap.set(url, new ImageClient(url));
		}
		return this.clientMap.get(url)!;
	}

	private constructor(url: string) {
		super();
		this.url = url;
		this._status = "noRequest";
	}

	public async getSavedImage(): Promise<ImageModel | null> {
		const imageAttr = await imageRepository.getImageByUrl(this.url);
		if (imageAttr) {
			this.imageModel = new ImageModel(imageAttr);
			this._status = "done";
			return this.imageModel;
		} else {
			return null;
		}
	}

	public async getImage(isLargeOk: boolean) {
		if (this._status !== "noRequest") {
			console.warn("can't get image because status is " + this.status);
			return;
		}
		this._status = "requesting";
		this.xhrPromise = xhrRequest<Blob>({
			url: this.url,
			responseType: "blob",
			onHeaderReceive: (header) => {
				const byteSize = +header["content-length"]!;
				const contentType = <ImageType>header["content-type"]!;
				if (!isLargeOk && byteSize >= 10000000) {
					this.cancel("サイズが10MBを超えています" + byteSize);
				}

				if (!imageTypes.includes(contentType)) {
					this.cancel("ファイル形式が不正です " + contentType);
				}
			},
			onProgress: (loaded, total) => {
				this.trigger("progress", [loaded, total]);
			}
		});
		this.xhrPromise.then(async (res) => {
			if (res.statusCode !== 200) {
				this.trigger("error", "200番以外のレスポンスコードを返しました レスポンスコード: " + res.statusCode);
				return;
			}
			this.imageModel = await ImageModel.saveImageFromResponse(res.body, this.url);
			this._status = "done";
			this.xhrPromise = null;
			this.trigger("done", this.imageModel);
		}).catch((reason) => {
			if (reason instanceof XhrRequestError) {
				this.trigger("error", "リクエストできませんでした");
			}
			this.xhrPromise = null;
			throw reason;
		});
	}

	public cancel(reason: string) {
		if (this.xhrPromise) {
			this.xhrPromise.cancel();
			console.debug("image request canceled reason: " + reason);
			this.trigger("abort", reason);
			this._status = "noRequest";
		} else {
			console.warn("no fetching");
		}
	}

	public getImageContextMenu(deleteCallback: () => void): Electron.MenuItemOptions[] {
		return [
			{
				label: "画像を削除",
				click: async () => {
					await this.delete();
					deleteCallback();
				}
			}, {
				label: "エクスプローラで開く",
				click: () => this.openFolder()
			}, {
				label: "他のアプリで画像を開く",
				click: () => this.openApp()
			}
		];
	}

	public async delete() {
			if (this.imageModel) {
				await FileUtil.deleteFile(this.imageModel.filePath);
				await FileUtil.deleteFile(this.imageModel.thumbnailPath);
				await imageRepository.deleteImage(this.imageModel.id!);
			}
			this.imageModel = undefined;
			this._status = "noRequest";
	}

	public async openFolder() {
		if (this.imageModel) {
			electron.shell.showItemInFolder(this.imageModel.filePath);
		}
	}

	public async openApp() {
		if (this.imageModel) {
			electron.shell.openItem(this.imageModel.filePath);
		}
	}

	/** @override */
	public disposeObserve(observerId: string) {
		super.disposeObserve(observerId);
		if (this.getObservers().length === 0) {
			ImageClient.clientMap.delete(this.url);
		}
	}

}
