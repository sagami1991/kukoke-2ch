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
	public async getResListFromLocal(sure: SureModel) {
		const savedDat = await this.readDatFile(sure);
		return this.toResListFromSaved(savedDat, sure);
	}

	public async getResListFromServer(sure: SureModel, myPostBody: string | undefined): Promise<ResModel[]> {
		let savedDatFile: Buffer | null = null;
		let requestHeader: XhrRequestHeader | undefined;
		if (sure.saved) {
			savedDatFile = await this.readDatFile(sure);
			requestHeader = sure.getRequestHeader();
		}
		const result = await NichanResListClient.fetchResList(sure.board, sure.datNo, requestHeader);
		const responseHeaders = result.response!.headers;
		let resList: ResModel[] = [];
		switch (result.type) {
		case "datOti":
			sure.enabled = false;
			this.updateSureTable(sure);
			savedDatFile = this.checkSavedDat(savedDatFile, sure);
			resList = this.toResListFromSaved(savedDatFile, sure);
			notify.warning("dat落ち");
			break;
		case "notModified":
			savedDatFile = this.checkSavedDat(savedDatFile, sure);
			resList = this.toResListFromSaved(savedDatFile, sure);
			notify.info("新着なし");
			break;
		case "sabun":
			savedDatFile = this.checkSavedDat(savedDatFile, sure);
			const concatedDat = Buffer.concat([savedDatFile, result.response!.body]);
			const oldResCount = sure.savedResCount || 0;
			const sureInfo = this.convertDatToResListAndTitle(sure, concatedDat, oldResCount, myPostBody);
			resList = sureInfo.resList;
			await this.saveDatFileAndUpdateSureTable(sure, concatedDat, sureInfo.sureTitle, responseHeaders["last-modified"]!, resList.length);
			notify.success(`新着あり ${sure.savedResCount! - oldResCount}件` );
			break;
		case "success":
			const dat = result.response!.body;
			const sureInfo2 = this.convertDatToResListAndTitle(sure, dat , 0, undefined);
			resList = sureInfo2.resList;
			await this.saveDatFileAndUpdateSureTable(sure, dat, sureInfo2.sureTitle, responseHeaders["last-modified"]!, resList.length);
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

	private convertDatToResListAndTitle(sure: SureModel, dat: Buffer, oldResCount: number, mySubmitedBody: string | undefined): { resList: ResModel[], sureTitle: string } {
		const datStr = sjisBufferToStr(dat);
		const resList = this.datStringToResList(datStr, oldResCount, sure, mySubmitedBody);
		const sureTitle = this.extractTitle(datStr);
		return {
			resList: resList,
			sureTitle: sureTitle
		};
	}

	private async saveDatFileAndUpdateSureTable(sure: SureModel, dat: Buffer, sureTitle: string, lastModified: string, resLength: number) {
		await this.saveDatFile(sure.getDatFilePath(), dat);
		sure.update(sureTitle, dat!.byteLength, lastModified, resLength);
		await this.updateSureTable(sure);
	}

	public async updateSureTable(sure: SureModel) {
		await db.transaction("rw", db.sures, async () => {
			await sureRepository.putSure(sure.toJSON());
		});
	}

	private toResListFromSaved(savedDat: Buffer, sure: SureModel) {
		return this.datStringToResList(sjisBufferToStr(savedDat), Infinity, sure, undefined);
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
	private datStringToResList(datBody: string, oldResCount: number, sure: SureModel, submitMyBody: string | undefined) {
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
			const resBody = splited[3];
			const toAnkerIndexes = this.setAnker(resBody, index, resList);
			this.pushUserResMap(userResMap, userId, index);
			const imageUrls = this.getImageUrls(resBody);
			const isNew = index >= oldResCount;
			if (isNew && submitMyBody !== undefined && this.isMyRes(resBody, submitMyBody)) {
				sure.addMyResIndex(index);
			}
			const resAttr = new ResModel({
				index: index,
				name: name,
				mail: mail,
				postDate: postDate,
				userId: userId,
				userBe: beInfo,
				body: resBody,
				fromAnkers: [],
				userIndexes: !userId ? [] : userResMap[userId],
				isNew: isNew,
				imageUrls: imageUrls,
				isAsciiArt: this.isAsciiArtRes(resBody),
				isMyRes: sure.isMyRes(index),
				isReplyRes: toAnkerIndexes[0] ? sure.isMyRes(toAnkerIndexes[0]) : false
			});
			resList.push(resAttr);
		});
		return resList;
	}

	private isMyRes(rawBody: string, submitedMyBody: string): boolean {
		return rawBody.replace(/<>|\s|<.+?>|&.+?;|Rock54:.+?\)/g, "") === submitedMyBody.replace(/\s|\n|&|>|</g, "");
	}

	private getImageUrls(body: string): string[] {
		let macher = /href="(https?:\/\/[\w/:;%#\$&\?\(\)~\.=\+\-@]+\.(png|gif|jpg|jpeg))">/ig;
		let array: RegExpExecArray | null;
		const imgUrls: string[] = [];
		while ((array = macher.exec(body)) !== null) {
			imgUrls.push(array[1]);
		}
		// おえかき
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
	private static ANKER_REGEXP = /<a.+?>&gt;&gt;([0-9]{1,4})-?<\/a>/g;
	private static TAG_REGEXP = /<a.+?>(.+?)<\/a>/g;
	private static LINK_REGEXP = /h?(ttps?:\/\/[\w/:;%#\$&\?\(\)~\.=\+\-@]+)/g;
	private static IMAGE_REGEXP = /href="(http:\/\/[\w/:;%#\$&\?\(\)~\.=\+\-@]+\.(png|gif|jpg|jpeg))">/g;

	/** 本文整形 */
	private bodyReplace(allBody: string) {
		// 末尾整形
		allBody = allBody.replace(ResListService.BR_REGEXP, "<br>");
		// アンカー
		allBody = allBody.replace(ResListService.ANKER_REGEXP, ($$, $1) => `<span class="res-anker" anker-to="${+$1 - 1}">&gt;&gt;${$1}</span>`);
		// その他アンカー系
		allBody = allBody.replace(ResListService.TAG_REGEXP, `$1`);
		// リンク
		allBody = allBody.replace(ResListService.LINK_REGEXP, `<a class="res-link" href="h$1">$&</a>`);
		// be-icon
		allBody = allBody.replace(/sssp:\/\/(img\.[2,5]ch\.net.+?\.gif)/g, `<img class="nichan-be-icon" src="http://$1">`);
		// // 画像
		// body = body.replace(/(h?ttps?:.+\.(png|gif|jpg|jpeg))<br>/, `<span class="res-image-link">$1</span><br>`);
		allBody = emojiUtil.replace(allBody);
		return allBody;
	}

	/** アンカー先のankerFromに設定 */
	private setAnker(line: string, nowIndex: number, resList: ResModel[]): number[] {
		const result = new RegExp(/anker-to="([0-9]{1,4})">/g).exec(line);
		if (result && +result[1] < nowIndex) {
			const toIndex = +result[1];
			resList[toIndex].fromAnkers.push(nowIndex);
			return [toIndex];
		}
		return [];
	}

	private isAsciiArtRes(body: string) {
		return /(●●|　\s)/.test(body);
	}

	private rawBodyToNichanFormat(body: string) {
	}
}

export const resListService = new ResListService(); 