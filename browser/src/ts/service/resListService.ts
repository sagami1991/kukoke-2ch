import { emoji } from '../common/emoji';
import { boardRepository } from 'database/boardRepository';
import { SureAttr } from 'database/tables';
import { db } from 'database/database';
import { sureRepository } from 'database/sureRepository';
import { FileUtil, sjisBufferToStr } from "common/commons";
import { NichanResListClient } from 'client/nichanResListClient';
import { ResModel, ResBeInfo } from 'model/resModel';
import { SureModel } from 'model/sureModel';
import { XhrHeaders } from "common/request";
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
	beInfo?: ResBeInfo;
}

/** 主にdat解析系をやってるが、色々 */
class ResListService {
	public async attrToModel(sure: SureAttr) {
		const board = await boardRepository.getBoard(sure.bDomain, sure.bPath);
		if (!board) {
			throw new Error("板がない");
		}
		return new SureModel(sure, board);
	}


	public async getResListFromCache(sure: SureModel) {
		const savedDat = await this.readDatFile(sure);
		if (savedDat === null) {
			throw new Error("datFileが見つからない");
		}
		return this.toResList(sjisBufferToStr(savedDat), sure.resCount);
	}

	public async getResListFromServer(sure: SureModel): Promise<ResModel[]> {
		const savedDat = await this.readDatFile(sure);
		const result = await NichanResListClient.fetchResList(sure.board, sure.datNo, sure.getRequestHeader());
		let dat: Buffer;
		let resList: ResModel[] = [];
		switch (result.type) {
		case "datOti":
			sure.enabled = false;
			this.updateSureTable(sure);
			notify.warn("dat落ち");
			resList = this.toResListFromSaved(savedDat);
			break;
		case "notModified":
			notify.info("新着なし");
			resList = this.toResListFromSaved(savedDat);
			break;
		case "sabun":
			dat = Buffer.concat([savedDat!, result.response!.body]);
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

	private async createResList(sure: SureModel, dat: Buffer, responseHeaders: XhrHeaders, oldResCount: number) {
		const datStr = sjisBufferToStr(dat!);
		const resList = this.toResList(datStr, oldResCount);
		const sureTitle = this.extractTitle(datStr);
		sure.update(sureTitle, dat!.byteLength, responseHeaders["last-modified"], resList.length);
		await this.saveDatFile(sure.getDatFilePath(), dat);
		await this.updateSureTable(sure);
		return resList;
	}

	private async updateSureTable(sure: SureModel) {
		await db.transaction("rw", db.sures, async () => {
			await sureRepository.upsertSure(sure.toJSON());
		});
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

	private toResListFromSaved(savedDat: Buffer | null) {
		if (savedDat === null) {
			throw new Error("datFileが見つからない");
		}
		return this.toResList(sjisBufferToStr(savedDat), Infinity);
	}

	private async readDatFile(sure: SureModel) {
		if (!sure.saved) {
			return null;
		}
		const saveDat = await FileUtil.readFile(sure.getDatFilePath());
		if (saveDat === null) {
			sure.reset();
		}
		return saveDat;
	}

	private async saveDatFile(path: string, dat: Buffer) {
		await FileUtil.wrtiteFile(path, dat);
	}

	private extractTitle(datBody: string) {
		const index = datBody.indexOf("\n");
		let sureTitle = datBody.slice(0, index).split("<>")[4];
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
			this.setAnker(splited[3], index, resList);
			this.pushUserResMap(userResMap, userId, index);
			const resAttr = new ResModel({
				index: index,
				name: name,
				mail: mail,
				postDate: postDate,
				userId: userId,
				userBe: beInfo,
				body: splited[3],
				fromAnkers: [],
				userIndexes: !userId ? [] : userResMap[userId],
				isNew: index >= oldResCount
			});
			resList.push(resAttr);
		});
		return resList;
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
	private static LINK_REGEXP = /h?(ttps?:\/\/[\w/:;%#\$&\?\(\)~\.=\+\-]+)/g;


	/** 本文整形 */
	private bodyReplace(body: string) {
		// 末尾整形
		body = body.replace(ResListService.BR_REGEXP, "<br>");
		// アンカー
		body = body.replace(ResListService.ANKER_REGEXP, ($$, $1) => `<span class="res-anker" anker-to="${+$1 - 1}">&gt;&gt;${$1}</span>`);
		// その他アンカー系
		body = body.replace(ResListService.TAG_REGEXP, `$1`);
		// リンク
		body = body.replace(ResListService.LINK_REGEXP, `<a class="res-link" href="h$1">$&</a>`);
		// // 画像
		// body = body.replace(/(h?ttps?:.+\.(png|gif|jpg|jpeg))<br>/, `<span class="res-image-link">$1</span><br>`);
		body = emoji.replace(body);
		return body;
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