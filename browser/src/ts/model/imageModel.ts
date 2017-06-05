import { db } from '../database/database';
import { imageRepository } from '../database/imageRepository';
import { ImageTable, ImageType } from 'database/tables';
import { Consts } from "const";
import { AppConstant } from "../../../../src/const";
import { TemplateUtil } from "common/commons";
import { FileUtil } from "common/file";

interface ResizedImageInfo {
	type: ImageType;
	rawWidth: number;
	rawHeight: number;
	rawByteLength: number;
	rawBuffer: Buffer;
	resizedBuffer: Buffer;
}

export class ImageModel {
	private static THUMBAIL_SIZE = 300;
	private attr: ImageTable;
	public get id() {
		return this.attr.id;
	}
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
		return `${Consts.USER_PATH}\\${AppConstant.IMAGE_DIR_NAME}\\${this.attr.fileName}`;
	}
	public get thumbnailPath() {
		return `${Consts.USER_PATH}\\${AppConstant.THUBNAIL_DIR_NAME}\\${this.attr.fileName}`;
	}

	public static getImageExtension(imageType: ImageType) {
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

	public static async saveImageFromResponse(resBody: Blob, url: string): Promise<ImageModel> {
		const resizedInfo = await this.resizeImage(resBody);
		const kariModel = new this({
				url: url,
				imageType: resizedInfo.type,
				fileName: TemplateUtil.dateFormatForFile(new Date()) + `.` + this.getImageExtension(resizedInfo.type),
				width: resizedInfo.rawWidth,
				height: resizedInfo.rawHeight,
				byteLength: resizedInfo.rawByteLength,
				exif: {},
		});
		await FileUtil.wrtiteFile(kariModel.filePath, resizedInfo.rawBuffer);
		await FileUtil.wrtiteFile(kariModel.thumbnailPath, resizedInfo.resizedBuffer);
		const attr = await db.transaction("rw", db.images, async () => {
			const id = await imageRepository.insertImage(kariModel.getAttr());
			return await imageRepository.getImage(id);
		});
		return new this(attr!);
	}

	private static async resizeImage(blob: Blob) {
		return new Promise<ResizedImageInfo>((resolve, reject) => {
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
						type: <ImageType>blob.type,
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