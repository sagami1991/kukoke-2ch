import { XhrRequestError } from '../common/error';
import { xhrRequest, IXhrResponse } from '../common/request';
import { ImageTable, TImageType } from '../database/tables';
import { db } from '../database/database';
import { CancelablePromise } from '../common/promise';
import { Observable } from '../base/observable';
import { AppConstant } from "../../../../src/const";
import { Consts } from "const";
import { templateUtil, FileUtil } from "common/commons";
import { electron } from "common/libs";

interface IImageClientEvent {
	"progress": [number, number];
	"done": ImageModel;
	"abort": string;
	"error": string;
}

const imageTypes: TImageType[] = ["image/png", "image/jpeg", "image/gif", "image/bmp"];

/** TODO クラス分け */
export class ImageClient extends Observable<IImageClientEvent> {
	private static clientMap: Map<string, ImageClient> = new Map();

	private readonly url: string;
	private xhrPromise: CancelablePromise<IXhrResponse<Blob>> | null;
	private _status: "noRequest" | "done" | "requesting";
	private imageId: number | undefined;
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
			this.imageId = imageAttr.id;
			const model = new ImageModel(imageAttr);
			this._status = "done";
			return model;
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
				const contentType = <TImageType>header["content-type"]!;
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
			const resizedInfo: IResizedImageInfo = await ImageModel.resizeImage(res.body);
			const notIdModel: ImageModel = ImageModel.createInstance(this.url, resizedInfo);
			await FileUtil.wrtiteFile(notIdModel.filePath, resizedInfo.rawBuffer);
			await FileUtil.wrtiteFile(notIdModel.thumbnailPath, resizedInfo.resizedBuffer);
			this._status = "done";
			this.xhrPromise = null;
			await db.transaction("rw", db.images, async () => {
				const id = await imageRepository.insertImage(notIdModel.getAttr());
				this.imageId = id;
			});
			this.trigger("done", notIdModel);
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

	public async delete() {
		if (this.imageId !== undefined) {
			const imageAttr = await imageRepository.getImage(this.imageId);
			if (imageAttr) {
				await imageRepository.deleteImage(this.imageId);
				const model = new ImageModel(imageAttr);
				await FileUtil.deleteFile(model.filePath);
				await FileUtil.deleteFile(model.thumbnailPath);
			}
			this.imageId = undefined;
			this._status = "noRequest";
		}
	}

	public async openFolder() {
		if (this.imageId !== undefined) {
			const imageAttr = await imageRepository.getImage(this.imageId);
			if (imageAttr) {
				const model = new ImageModel(imageAttr);
				electron.shell.showItemInFolder(model.filePath);
			}
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

interface IResizedImageInfo {
	type: TImageType;
	rawWidth: number;
	rawHeight: number;
	rawByteLength: number;
	rawBuffer: Buffer;
	resizedBuffer: Buffer;
}
export class ImageModel {
	private static THUMBAIL_SIZE = 300;
	private attr: ImageTable;
	public get url() {
		return this.attr.url;
	}
	public get imageType() {
		return this.attr.imageType;
	}
	public get byteLength() {
		return this.attr.byteLength;
	}
	public get width() {
		return this.attr.width;
	}
	public get height() {
		return this.attr.height;
	}
	public get filePath() {
		return `${Consts.USER_PATH}/${AppConstant.IMAGE_DIR_NAME}/${this.attr.fileName}`;
	}
	public get thumbnailPath() {
		return `${Consts.USER_PATH}/${AppConstant.THUBNAIL_DIR_NAME}/${this.attr.fileName}`;
	}

	public static getImageExtension(imageType: TImageType) {
		switch (imageType) {
			case "image/bmp":
				return "bmp";
			case "image/gif":
				return "gif";
			case "image/jpeg":
				return "jpg";
			case "image/png":
				return "png";
			default:
				new Error("unexpected image type");
		}
	}

	public static createInstance(url: string, resizedInfo: IResizedImageInfo) {
		return new this({
			url: url,
			imageType: resizedInfo.type,
			fileName: templateUtil.dateFormatForFile(new Date()) + `.` + this.getImageExtension(resizedInfo.type),
			width: resizedInfo.rawWidth,
			height: resizedInfo.rawHeight,
			byteLength: resizedInfo.rawByteLength,
			exif: {},
		});
	}

	public static async resizeImage(blob: Blob) {
		return new Promise<IResizedImageInfo>((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener("load", () => {
				const dataURL: string = reader.result;
				const canvas = document.createElement("canvas");
				const canvasContext = canvas.getContext("2d")!;
				const image = new Image();
				image.addEventListener("load", () => {
					let width: number;
					let height: number;
					if (image.height > image.width) {
						height = Math.min(this.THUMBAIL_SIZE, image.height);
						width = image.width * height / image.height;
					} else {
						width = Math.min(this.THUMBAIL_SIZE, image.width);
						height = image.height * width / image.width;
					}
					canvas.width = width;
					canvas.height = height;
					canvasContext.drawImage(image, 0, 0, width, height);
					const buffer = new Buffer(canvas.toDataURL(blob.type, 0.95).split(",")[1], "base64");
					resolve({
						type: <TImageType>blob.type,
						rawWidth: image.width,
						rawHeight: image.height,
						rawByteLength: blob.size,
						rawBuffer: new Buffer(dataURL.split(",")[1], "base64"),
						resizedBuffer: buffer
					});
				});
				image.addEventListener("error", (e) => {
					reject(e.message);
				});
				image.src = dataURL;
			});
			reader.addEventListener("error", (e) => {
				reject(e.message);
			});
			reader.readAsDataURL(blob);
		});
	}
	constructor(attr: ImageTable) {
		this.attr = attr;
	}

	public getAttr() {
		return this.attr;
	}


}

class ImageRepository {
	public getImage(id: number): Promise<ImageTable | undefined> {
		return db.images.get(id);
	}
	public getImageByUrl(url: string): Promise<ImageTable | undefined> {
		return db.images.where("url").equals(url).first();
	}

	public insertImage(image: ImageTable): Promise<number> {
		return db.images.add(image);
	}

	public deleteImage(id: number): Promise<void> {
		return db.images.delete(id);
	}
}

const imageRepository = new ImageRepository();