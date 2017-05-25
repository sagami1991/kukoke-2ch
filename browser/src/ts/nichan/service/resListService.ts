import { emoji } from '../../commons/emoji';
import { boardRepository } from '../../database/boardRepository';
import { SureAttr } from '../../database/tables';
import { db } from 'database/database';
import { sureRepository } from 'database/sureRepository';
import { statusBar } from '../../view/statusBarView';
import { FileUtil, sjisBufferToStr } from "commons/commons";
import { NichanResListClient } from 'nichan/client/nichanResListClient';
import { ResAttr } from 'nichan/interfaces';
import { SureModel } from 'nichan/model/sureModel';
import { XhrHeaders } from "commons/request";
import { Nichan } from "nichan/constants";
import { notify } from "commons/libs";
export interface PopupRes {
	nestCount: number;
	res: ResAttr;
}

export interface ResBeInfo {
	id: string;
	displayName: string;
}

interface ResHeader {
	name: string;
	mail: string;
	postDate: string;
	userId: string;
	beInfo?: ResBeInfo;
}


class ResListService {

	public async attrToModel(sure: SureAttr) {
		const board = await boardRepository.getBoard(sure.bDomain, sure.bPath);
		if (!board) {
			throw new Error();
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

	public async getResListFromServer(sure: SureModel, mode: "reload" | "fetch"): Promise<ResAttr[]> {
		const savedDat = await this.readDatFile(sure);
		if (!sure.enabled) {
			notify.warning("dat落ち");
			return this.toResListFromSaved(savedDat);
		}
		const response = await NichanResListClient.fetchResList(sure.board, sure.datNo, sure.getRequestHeader());
		if (response === null) {
			notify.info("新着なし");
			return this.toResListFromSaved(savedDat);
		}
		const dat = this.concatDat(savedDat, response.body);
		const datStr = sjisBufferToStr(dat);
		const oldResCount = sure.savedResCount || 0;
		const resList = this.toResList(datStr, oldResCount);
		const sureTitle = this.extractTitle(datStr);
		await this.saveFile(sure, dat, response.headers);
		sure.postSaveDat(sureTitle, dat, response.headers, resList.length);
		if (!sure.enabled) {
			notify.warning("dat落ち");
		} else if (oldResCount) {
			notify.success(`新着あり ${sure.savedResCount! - oldResCount}件` );
		} else {
			notify.success(`新規取得完了 ${resList.length}件` );
		}
		await db.transaction("rw", db.sures, async () => {
			await sureRepository.upsertSure(sure.toJSON());
		}).catch((e) => {
			console.error(e.stack);
			throw e;
		});
		return resList;
	}


	/** 深さ優先でツリーつくる */
	public deepSearchAnker(resList: ResAttr[], index: number, result: PopupRes[] = [], nestCount = 0) {
		if (nestCount === 0) {
			result.push({nestCount: 0, res: resList[index]});
		}
		resList[index].fromAnkers.forEach((fromAnkerIndex) => {
			result.push({nestCount: nestCount + 1, res: resList[fromAnkerIndex]});
			this.deepSearchAnker(resList, fromAnkerIndex, result, nestCount + 1);
		});
		return result;
	}

	private toResListFromSaved(savedDat: Buffer | null) {
		if (savedDat === null) {
			throw new Error("datFileが見つからない");
		}
		return this.toResList(sjisBufferToStr(savedDat), Infinity);
	}

	private concatDat(savedDat: Buffer | null, resBody: Buffer) {
		if (savedDat) {
			return Buffer.concat([savedDat, resBody])
		} else {
			return resBody;
		}
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

	private async saveFile(sure: SureModel, dat: Buffer, headers: XhrHeaders) {
		await FileUtil.wrtiteFile(sure.getDatFilePath(), dat);
	}

	private extractTitle(datBody: string) {
		const index = datBody.indexOf("\n");
		let sureTitle = datBody.slice(0, index).split("<>")[4];
		sureTitle = sureTitle ? sureTitle.split(" [無断転載禁止]")[0] : "";
		return sureTitle;
	}

	/** TODO 正規表現とsplitのパフォーマンス確認 */
	private toResList(datBody: string, oldResCount: number) {
		const lines = datBody.split("\n");
		const resList: ResAttr[] = [];
		const userResMap: { [id: string]: number[] } = {};
		lines.forEach((line, index) => {
			const splited = line.split("<>");
			if (splited.length < 4) {
				return;
			}
			const resHeader = this.getResHeaders(splited);
			this.setAnker(line, index, resList);
			const resAttr: ResAttr = {
				index: index,
				name: resHeader.name,
				mail: resHeader.mail,
				postDate: resHeader.postDate,
				userId: resHeader.userId,
				userBe: resHeader.beInfo,
				body: this.bodyReplace(splited[3]),
				fromAnkers: [],
				thumbs: [],
				idColor: "normal",
				idCount: "",
				noColor: "normal",
				isNew: index >= oldResCount
			};
			resList.push(resAttr);
			this.pushUserResMap(userResMap, resAttr.userId, resAttr.index);
		});
		resList.forEach(res => {
			const indexes = userResMap[res.userId];
			res.idCount = `${indexes.indexOf(res.index) + 1}/${indexes.length}`;
			res.idColor = this.getIdColor(indexes.length);
			res.noColor = this.getResColor(res.fromAnkers.length);
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

	private getIdColor(length: number) {
		if (length >= 5) {
			return "red";
		} else if (length >= 2) {
			return "blue";
		} else {
			return "normal";
		}
	}

	private getResColor(fromAnkers: number) {
		if (fromAnkers >= 3) {
			return "red";
		} else if (fromAnkers >= 1) {
			return "blue";
		} else {
			return "normal";
		}
	}

	private pushUserResMap(userResMap: { [id: string]: number[] }, userId: string, index: number) {
		if (!userResMap[userId]) {
			userResMap[userId] = [index];
		} else {
			userResMap[userId].push(index);
		}
	}

	/** 本文整形 */
	private bodyReplace(body: string) {
		// 末尾整形
		body = body.replace(/\s<br>/g, "<br>");
		// アンカー
		body = body.replace(/<a.+>&gt;&gt;([0-9]{1,4})-?<\/a>/g, `<span class="res-anker" anker-to="$1">&gt;&gt;$1</span>`);
		// その他アンカー系
		body = body.replace(/<a.+>(.+)<\/a>/g, `$1`);
		// リンク
		body = body.replace(/h?(ttps?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-]+)/g, `<a class="res-link" href="h$1">$&</a>`);
		// // 画像
		// body = body.replace(/(h?ttps?:.+\.(png|gif|jpg|jpeg))<br>/, `<span class="res-image-link">$1</span><br>`);
		return body;
	}

	/** アンカー先のankerFromに設定 */
	private setAnker(line: string, nowIndex: number, resList: ResAttr[]) {
		const result = new RegExp(/&gt;&gt;([0-9]{1,4})/g).exec(line);
		if (result && +result[1] <= nowIndex) {
			resList[+result[1] - 1].fromAnkers.push(nowIndex);
		}
	}
}

export const resListService = new ResListService(); 