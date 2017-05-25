import { mapToFormData, xhrRequest } from '../../commons/commons';
import { Nichan } from "../constants";

export class NichanAuthClient {
	private static lastFetchDate: Date | undefined;
	public static async getSessionId() {
		if (this.isRecentFetch()) {
			throw new Error("3秒以内に取得している");
		}
		const res = await xhrRequest({
			method: "POST",
			url: "https://api.2ch.net/v1/auth/",
			data: mapToFormData({
				KY: Nichan.APP_KEY,
				CT: Nichan.CT,
				HB: Nichan.HB
			})
		});
		const sessionId = res.body.toString().split(":")[1];
		this.lastFetchDate = new Date();
		return sessionId;
	}

	/** 3秒以内に取得しているか */
	private static isRecentFetch() {
		return this.lastFetchDate && new Date().getTime() - this.lastFetchDate.getTime() < 3000;
	}
}