import { emojiUtil } from '../common/emoji';
import { db } from 'database/database';
import { sureRepository } from 'database/sureRepository';
import { FileUtil, sjisBufferToStr } from "common/commons";
import { NichanResListClient } from 'client/nichanResListClient';
import { ResModel, UserBe } from 'model/resModel';
import { SureModel } from 'model/sureModel';
import { XhrRequestHeader, XhrResponseHeader } from "common/request";
import { notify } from "common/libs";

export interface PopupRes {
	nestCount: number;
	res: ResModel;
}

interface ResHeader {
	name: string;
	mail: string;
	postDate: string;
	userId: string;
	beInfo?: UserBe;
}

class ResListService {
	public async getResListFromCache(sure: SureModel) {
		const savedDat = await this.readDatFile(sure);
		return this.toResListFromSaved(savedDat);
	}

	public async getResListFromServer(sure: SureModel): Promise<ResModel[]> {
		let savedDatFile: Buffer | null = null;
		let requestHeader: XhrRequestHeader | undefined;
		if (sure.saved) {
			savedDatFile = await this.readDatFile(sure);
			requestHeader = sure.getRequestHeader();
		}
		const result = await NichanResListClient.fetchResList(sure.board, sure.datNo, requestHeader);
		let dat: Buffer;
		let resList: ResModel[] = [];
		switch (result.type) {
		case "datOti":
			sure.enabled = false;
			this.updateSureTable(sure);
			savedDatFile = this.checkSavedDat(savedDatFile, sure);
			resList = this.toResListFromSaved(savedDatFile);
			notify.warning("dat落ち");
			break;
		case "notModified":
			savedDatFile = this.checkSavedDat(savedDatFile, sure);
			resList = this.toResListFromSaved(savedDatFile);
			notify.info("新着なし");
			break;
		case "sabun":
			savedDatFile = this.checkSavedDat(savedDatFile, sure);
			dat = Buffer.concat([savedDatFile, result.response!.body]);
			const oldResCount = sure.savedResCount || 0;
			resList = await this.createResList(sure, dat, result.response!.headers, oldResCount);
			notify.success(`新着あり ${sure.savedResCount! - oldResCount}件` );
			break;
		case "success":
			dat = result.response!.body;
			resList = await this.createResList(sure, dat, result.response!.headers, 0);
			notify.success(`新規取得完了 ${resList.length}件` );
			break;
		case "unexpectedCode":
			notify.error(`予期しないエラー`);
			throw new Error("予期しないステータスコード");
		}
		return resList;
	}

	/** 深さ優先でツリーつくる */
	public deepSearchAnker(resList: ResModel[], index: number, popupReses: PopupRes[] = [], nestCount = 0) {
		if (nestCount === 0) {
			popupReses.push({nestCount: 0, res: resList[index]});
		}
		resList[index].fromAnkers.forEach((fromAnkerIndex) => {
			popupReses.push({nestCount: nestCount + 1, res: resList[fromAnkerIndex]});
			this.deepSearchAnker(resList, fromAnkerIndex, popupReses, nestCount + 1);
		});
		return popupReses;
	}

	public async deleteSure(sure: SureModel) {
		await sureRepository.deleteSure(sure.id);
		await FileUtil.deleteFile(sure.getDatFilePath());
	}

	private async createResList(sure: SureModel, dat: Buffer, responseHeaders: XhrResponseHeader, oldResCount: number) {
		const datStr = sjisBufferToStr(dat!);
		const resList = this.toResList(datStr, oldResCount);
		const sureTitle = this.extractTitle(datStr);
		sure.update(sureTitle, dat!.byteLength, responseHeaders["last-modified"]!, resList.length);
		await this.saveDatFile(sure.getDatFilePath(), dat);
		await this.updateSureTable(sure);
		return resList;
	}

	public async updateSureTable(sure: SureModel) {
		await db.transaction("rw", db.sures, async () => {
			await sureRepository.putSure(sure.toJSON());
		});
	}

	private toResListFromSaved(savedDat: Buffer) {
		return this.toResList(sjisBufferToStr(savedDat), Infinity);
	}

	private async readDatFile(sure: SureModel) {
		let savedDat = await FileUtil.readFile(sure.getDatFilePath());
		savedDat = this.checkSavedDat(savedDat, sure);
		return savedDat;
	}

	private checkSavedDat(savedDat: Buffer | null, sure: SureModel) {
		if (!savedDat) {
			toastr.error("保存したdatFileが削除されています。");
			sure.reset();
			throw new Error("datFileが見つからない");
		} else {
			return savedDat;
		}
	}

	private async saveDatFile(path: string, dat: Buffer) {
		await FileUtil.wrtiteFile(path, dat);
	}

	private extractTitle(datBody: string) {
		const index = datBody.indexOf("\n");
		const firstRow = datBody.slice(0, index);
		let sureTitle = firstRow.split("<>")[4];
		sureTitle = sureTitle ? sureTitle.split(" [無断転載禁止]")[0] : "";
		return sureTitle;
	}

	/** TODO 正規表現とsplitのパフォーマンス確認 */
	private toResList(datBody: string, oldResCount: number) {
		datBody = this.bodyReplace(datBody);
		const lines = datBody.split("\n");
		const resList: ResModel[] = [];
		const userResMap: { [id: string]: number[] } = {};
		lines.forEach((line, index) => {
			const splited = line.split("<>");
			if (splited.length < 4) {
				return;
			}
			const {name, mail, postDate, userId, beInfo } = this.getResHeaders(splited);
			const body = splited[3];
			this.setAnker(body, index, resList);
			this.pushUserResMap(userResMap, userId, index);
			const imageUrls = this.getImageUrls(body);
			const resAttr = new ResModel({
				index: index,
				name: name,
				mail: mail,
				postDate: postDate,
				userId: userId,
				userBe: beInfo,
				body: body,
				fromAnkers: [],
				userIndexes: !userId ? [] : userResMap[userId],
				isNew: index >= oldResCount,
				imageUrls: imageUrls
			});
			resList.push(resAttr);
		});
		return resList;
	}

	
	private getImageUrls(body: string): string[] {
		let macher = /href="(http:\/\/[\w/:;%#\$&\?\(\)~\.=\+\-]+\.(png|gif|jpg|jpeg))">/g;
		let array: RegExpExecArray | null;
		const imgUrls: string[] = [];
		while ((array = macher.exec(body)) !== null) {
			imgUrls.push(array[1]);
		}
		body.replace(/sssp:\/\/(o\.8ch\.net\/....\.png)/g, ($$, $1) => {
			imgUrls.push(`http://${$1}`);
			return "";
		});
		return imgUrls;
	}

	/** TODO */
	private replace2chUrl(body: string) {
		const macher = /<a class="res-link" href="http:\/\/(.+?)\.(.+?)\/test\/read\.cgi\/(.+?)\/([0-9]{9,10}?)\/?">/g;
		let array: RegExpExecArray | null;
		while ((array = macher.exec(body)) !== null) {
		}
	}

	private getResHeaders(splited: string[]): ResHeader {
		const name = splited[0].replace(/<\/?b>|/g, "");
		const mail = splited[1];
		const dateAndId = splited[2].split(" ID:");
		const date = dateAndId[0];
		let id = dateAndId[1];
		const splitId = id ? id.split(" BE:") : null;
		let beInfo: {id: string; displayName: string} | undefined;
		if (splitId && splitId[1]) {
			id = splitId[0];
			const splitedBe = splitId[1].split("-");
			beInfo = {
				id: splitedBe[0],
				displayName: splitedBe[1]
			};
		}
		return {
			name: name,
			mail: mail,
			postDate: date,
			userId: id,
			beInfo: beInfo
		};
	}

	private pushUserResMap(userResMap: { [id: string]: number[] }, userId: string, index: number) {
		if (!userResMap[userId]) {
			userResMap[userId] = [index];
		} else {
			userResMap[userId].push(index);
		}
	}

	private static BR_REGEXP = /\s<br>/g;
	private static ANKER_REGEXP = /<a.+>&gt;&gt;([0-9]{1,4})-?<\/a>/g;
	private static TAG_REGEXP = /<a.+>(.+)<\/a>/g;
	private static LINK_REGEXP = /h?ttps?:\/\/([\w/:;%#\$&\?\(\)~\.=\+\-]+)/g;
	private static IMAGE_REGEXP = /href="(http:\/\/[\w/:;%#\$&\?\(\)~\.=\+\-]+\.(png|gif|jpg|jpeg))">/g;

	/** 本文整形 */
	private bodyReplace(allBody: string) {
		// 末尾整形
		allBody = allBody.replace(ResListService.BR_REGEXP, "<br>");
		// アンカー
		allBody = allBody.replace(ResListService.ANKER_REGEXP, ($$, $1) => `<span class="res-anker" anker-to="${+$1 - 1}">&gt;&gt;${$1}</span>`);
		// その他アンカー系
		allBody = allBody.replace(ResListService.TAG_REGEXP, `$1`);
		// リンク
		allBody = allBody.replace(ResListService.LINK_REGEXP, `<a class="res-link" href="http://$1">$&</a>`);
		allBody = allBody.replace(/sssp:\/\/(img\.2ch\.net.+?\.gif)/g, `<img class="nichan-be-icon" src="http://$1">`);
		// // 画像
		// body = body.replace(/(h?ttps?:.+\.(png|gif|jpg|jpeg))<br>/, `<span class="res-image-link">$1</span><br>`);
		allBody = emojiUtil.replace(allBody);
		return allBody;
	}

	/** アンカー先のankerFromに設定 */
	private setAnker(line: string, nowIndex: number, resList: ResModel[]) {
		const result = new RegExp(/anker-to="([0-9]{1,4})">/g).exec(line);
		if (result && +result[1] < nowIndex) {
			resList[+result[1]].fromAnkers.push(nowIndex);
		}
	}
}

export const resListService = new ResListService(); 