export namespace Nichan  {
	export const APP_KEY = "JYW2J6wh9z8p8xjGFxO3M2JppGCyjQ";
	export const HM_KEY = "hO2QHdapzbqbTFOaJgZTKXgT2gWqYS";
	export const CT = "1234567890";
	export const HB = "e639a54671ccf9f839f0aee2a58fc7d5ad36b031a80611fd9e4409201fda8e69";
	export const USER_AGENT = "Mozilla/3.0 (compatible; JaneStyle/3.83)";
	export const BBS_MENU_URL = "http://menu.2ch.net/bbsmenu.html";
	export enum ThreadStatus {
		/** 取得不可能？ */
		NOT_AVAILABLE = 0,
		/** 正常取得 */
		ENABLED = 1,
		/** dat落ち？？・ */
		DISABLED_ = 2,
		/** 過去ログ？ */
		KAKO = 3,
		/** 取得したがdat落ち？ */
		DISABLED = 8,
	};
	export enum UserStatus {
		/** sessionId無効 */
		UNAUTHORIZED = 0,
		/** sessionId有効 */
		ENABLED = 1,
		/** https://2chv.tora3.net/ */
		MARU_ENABLED = 2,
		/** 浪人 */
		RONIN_ENABLED = 3
	};
};
