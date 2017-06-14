import { contextMenuController } from '../common/contextmenu';
import { VirtualScrollView, VirtualScrillViewOption } from "common/virtualScrollView/virtualScrollView";
import { alertMessage } from '../common/utils';
import { notify, electron } from '../common/libs';
import { Popup } from '../common/popup';
import { PopupRes } from 'service/resListService';
import { SureModel } from 'model/sureModel';
import { ResModel } from 'model/resModel';
import { TemplateUtil, ElementUtil } from 'common/commons';
import { ComponentScanner } from 'component/scanner';
import { Button, SearchText, Dropdown, Text} from 'component/components';
import { ButtonOption, SearchTextOption, DropdownOption, ImageThumbnail } from 'component/components';
import { resListService } from 'service/resListService';
import { Panel, PanelType } from './basePanel';
import { OpenFormOption } from "panel/formPanel";

interface ResListStorage {
	sureId: number | null;
}

interface ResListPanelEvent {
	"changeSure": SureModel;
	"openForm": OpenFormOption;
	"openImage": string;
}

type FilterType = "all" | "popularity" | "image" | "link" | "search";
type RefreshMode = "reload" | "change";
type RenderMode = "all" | "filtering";
export class ResListPanel extends Panel<ResListPanelEvent, ResListStorage> {
	private readonly content: HTMLElement;
	private openedSure: SureModel | undefined;
	private resModels: ResModel[];
	private renderMode: RenderMode;
	public get panelType(): PanelType {
		return "resList";
	}

	// components
	private readonly virtialResList: VirtualScrollView;
	private readonly backButton: Button;
	private readonly refreshButton: Button;
	private readonly createButton: Button;
	private readonly filterDropdown: Dropdown<FilterType>;
	private readonly searchText: SearchText;
	private readonly urlButton: Button;
	private readonly menuButton: Button;

	private template() {
		return `
			<div class="panel-container panel-res-list">
				<div class="panel-layer"></div>
				<div class="panel-command-bar">
					${this.backButton.html()}
					${this.refreshButton.html()}
					${this.createButton.html()}
					${this.filterDropdown.html()}
					${this.searchText.html()}
					${this.urlButton.html()}
					${this.menuButton.html()}
					<div class="panel-loading-bar"></div>
				</div>
				<div class="panel-content"></div>
			</div>
		`;
	}


	private resTemplate(res: ResModel, className?: string) {
		return `` +
		`<div class="` +
				`res-container ${className || ""} ` +
				`${res.isMyRes ? "res-my" : ""} ` +
				`${res.isReplyRes ? "res-reply" : ""} ` +
				`"` +
			` res-index = "${res.index}"` +
		`>` +
			`<div class="res-header">` +
				`<span class="res-no ${res.getResColor()} ${TemplateUtil.when(res.isNew, () => "res-new")}" ` +
					`res-index = "${res.index}"` +
				 `>` +
					`${res.index + 1}${res.getIndexFormat()}` +
				`</span>` +
				`<span class="res-name">` +
					`名前: ${res.name}` +
				`</span>` +
				`<span class="res-postdate">` +
					`${res.postDate}` +
				`</span>` +
				`${TemplateUtil.when(res.userId, () => `` +
					`<span class="res-user-id ${res.getIdColor()}" res-index="${res.index}">` +
						`ID:${res.userId} ${res.getIdCountFormat()}` +
					`</span>`
				)}` +
				`${TemplateUtil.when(res.userBe, () => `` +
					`<span class="res-user-be">` +
						`BE:${res.userBe!.displayName}` +
					`</span>`
				)}` +
			`</div>` +
			`<div class="res-body ` +
				`${res.isAsciiArt ? "res-ascii-art" : ""}" ` +
			`>` +
				`${res.body}` +
			`</div>` +
			`<div class="res-thumbnails">${
				TemplateUtil.each(res.imageUrls, url => {
					const imageComponent = new ImageThumbnail({url: url});
					imageComponent.addListener("openImage", this.ovserverId, (url) => {
						this.trigger("openImage", url);
					});
					return imageComponent.html();
				})}
			</div>` +
		`</div>`
		;
	}
	constructor() {
		super();
		this.backButton = new Button(this.getBackButtonOption());
		this.refreshButton = new Button(this.getRefreshButtonOption());
		this.createButton = new Button(this.getSubmitButtonOption());
		this.searchText = new SearchText(this.getSearchTextOption());
		this.filterDropdown = new Dropdown(this.getDropdownOption());
		this.urlButton = new Button({
			icon: "icon-link",
			label: "URL",
			className: "url-button",
			onClick: () => {
				const text = new Text({
					value: this.openedSure!.getSureUrl(),

				});
				new Popup({
					innerElement: ComponentScanner.scanHtml(`<div class="popup-url">${text.html()}</div>`),
					target: this.urlButton.element
				});
			}
		});
		this.menuButton = new Button(this.getMenuButtonOption());
		this._el = ComponentScanner.scanHtml(this.template());
		this.content = <HTMLElement> this._el.querySelector(".panel-content");
		this.addClickEvent(this.content);
		this.virtialResList = new VirtualScrollView(this.getVirtualListOption())
	}

	public async init() {
		if (this.storage.sureId !== null) {
			try {
				const sure = await SureModel.createInstanceFromId(this.storage.sureId);
				await this.reload(sure, "localDb");
				this.openedSure = sure;
			} catch (error) {
				this.storage.sureId = null;
				console.error(error);
			}
		}
	}

	public async saveStorage() {
		await this.saveBookMark();
		super.saveStorage();
	}

	public onChangeSize() {
		this.virtialResList.changeParentSize();
	}

	private async saveBookMark() {
		const sure = this.openedSure;
		if (sure) {
			sure.bookmarkIndex = this.virtialResList.getNowIndex();
			await resListService.updateSureTable(sure);
		}
	}

	private addClickEvent(parent: Element) {
		ElementUtil.addDelegateEventListener(parent, "click", ".res-no", (e, current) => {
			const index = current.getAttribute("res-index");
			if (index === null) {
				throw new Error();
			}
			const result = resListService.deepSearchAnker(this.resModels, +index);
			this.popup(result, current);
		});
		ElementUtil.addDelegateEventListener(parent, "contextmenu", ".res-container", (e, current) => {
			const index = current.getAttribute("res-index");
			if (index === null) {
				return;
			}
			current.setAttribute("kukoke-active", "true");
			contextMenuController.addMenu([
				{
					label: "これにレス",
					click: () => this.openForm(`>>${+index + 1}`)
				}, {
					label: "自分のレスとマーク",
					click: () => {
						if (this.openedSure && this.resModels) {
							const userId = this.resModels[+index].userId;
							if (userId) {
								this.openedSure.addMyUserResId(userId);
							} else {
								this.openedSure.addMyResIndex(+index);
							}
							this.reload(this.openedSure, "localDb");
						}
					}
				}
			]);
			contextMenuController.setCallBack(() => {
				current.removeAttribute("kukoke-active");
			});
		});
		ElementUtil.addDelegateEventListener(parent, "click", ".res-anker", (e, current) => {
			const index = current.getAttribute("anker-to");
			if (index === null) {
				throw new Error();
			}
			const res = this.resModels[+index];
			if (!res) {
				return;
			}
			this.popup([{nestCount: 0, res: res}], current);
		});

		ElementUtil.addDelegateEventListener(parent, "click", ".res-user-id", (e, current) => {
			const index = current.getAttribute("res-index");
			if (index === null) {
				throw new Error();
			}
			const userResIndexes = this.resModels[+index].userIndexes;
			const userReses = userResIndexes.map<PopupRes>(index => ({nestCount: 0, res: this.resModels[index]}));
			this.popup(userReses, current);
		});

	}

	private getVirtualListOption(): VirtualScrillViewOption {
		return {
			rowElements: [],
			minRowHeight: 55,
			parent: this.content,
			initIndex: 0
		};
	}

	/** @override */
	protected getStorageForSave(): ResListStorage {
		return {
			sureId: this.openedSure ? this.openedSure.id : null
		};
	}

	/** @override */
	protected getDefaultStorage(): ResListStorage {
		return {
			sureId: null
		};
	}

	private getBackButtonOption(): ButtonOption {
		return {
			icon: "icon-navigate-back",
			iconSize: "m",
			style: "icon-only",
			onClick: () => alert("未実装")
		};
	}

	private getRefreshButtonOption(): ButtonOption {
		return {
			icon: "icon-reload",
			iconSize: "m",
			style: "icon-only",
			onClick: () => {
				if (this.openedSure) {
					this.reload(this.openedSure, "server");
				}
			}
		};
	}

	private getMenuButtonOption(): ButtonOption {
		return {
			icon: "icon-menu",
			style: "icon-only",
			onClick: () => {
				contextMenuController.popupMenu([
					{
						label: "ログを削除",
						click: () => this.deleteLog()
					}, {
						label: "次スレを検索",
						click: () => alertMessage("info", "未実装")
					}, {
						label: "板を開く",
						click: () => alertMessage("info", "未実装")
					}, {
						label: "ブラウザで開く",
						click: () => {
							if (this.openedSure) {
								electron.shell.openExternal(this.openedSure.getSureUrl());
							}
						}
					}, {
						label: "datファイルを開く",
						click: () => {
							if (this.openedSure) {
								electron.shell.showItemInFolder(this.openedSure.getDatFilePath());
							}
						}
					}
				]);
			}
		};
	}

	private getSearchTextOption(): SearchTextOption {
		return {
			width: 160,
			placeholder: "本文を検索",
			onChange: (text) => this.search(text)
		};
	}

	private getDropdownOption(): DropdownOption<FilterType> {
		return {
			defaultItem: "all",
			items: [
				{
					icon: "icon-filter",
					label: "フィルター選択",
					id: "all"
				}, {
					icon: "icon-comment",
					label: "人気レス",
					id: "popularity"
				}, {
					icon: "icon-image",
					label: "画像レス",
					id: "image"
				}, {
					icon: "icon-link",
					label: "リンクレス",
					id: "link"

				}
			],
			onSelect: (filterType) => this.filter(filterType),
			width: 150
		};
	}

	private getSubmitButtonOption(): ButtonOption {
		return {
			icon: "icon-pen",
			iconSize: "m",
			style: "icon-only",
			onClick: () => this.openForm()
		};
	}

	public async openSure(sure: SureModel, myPostBody?: string) {
		await this.reload(sure, "server");
		this.openedSure = sure;
		this.trigger("changeSure", sure);
	}

	private async reload(sure: SureModel, mode: "localDb" | "server" ) {
		await this.loadingTransaction(async () => {
			let resModels: ResModel[];
			if (mode === "localDb") {
				resModels = await resListService.getResListFromLocal(sure);
			} else {
				resModels = await resListService.getResListFromServer(sure);
			}
			this.setResCollection(sure, resModels);
			if (this.openedSure === sure) {
				this.virtialResList.changeContentsWithKeep(this.convertResElements(resModels));
			} else {
				await this.saveBookMark();
				this.virtialResList.changeContents(this.convertResElements(resModels), sure.bookmarkIndex);
			}
			this.renderMode = "all";
			this.filterDropdown.changeItem(this.renderMode);
		}, {
			delayLockKey: mode === "server" ? sure.id : undefined
		});
	}

	private async deleteLog() {
		if (this.openedSure) {
			const sure = this.openedSure;
			this.virtialResList.empty();
			this.openedSure = undefined;
			this.resModels = [];
			this._title = "";
			await resListService.deleteSure(sure);
			this.trigger("changeSure", sure);
			this.trigger("changeTitle", "");
		}
	}

	private filter(type: FilterType, text?: string) {
		if (!this.openedSure || !this.resModels) {
			return;
		}
		if (this.renderMode === "all") {
			this.saveBookMark();
		}
		let resModels: ResModel[] | undefined;
		let index: number | undefined;
		switch (type) {
		case "all":
			resModels = this.resModels;
			index = this.openedSure.bookmarkIndex;
			this.renderMode = "all";
			break;
		case "popularity":
			resModels = this.resModels.filter(res => res.fromAnkers.length >= 3);
			this.renderMode = "filtering";
			break;
		case "image":
			resModels = this.resModels.filter(res => res.imageUrls.length > 0);
			this.renderMode = "filtering";
			break;
		case "link":
			alertMessage("info", "未実装");
			return;
		case "search":
			resModels = this.resModels.filter(res => res.body.toLowerCase().match(text!) !== null);
			this.renderMode = "filtering";
		}
		if (resModels) {
			this.virtialResList.changeContents(this.convertResElements(resModels), index);
			this.filterDropdown.changeItem(type);
		}
		return;
	}

	private openForm(initBody?: string) {
		if (!this.openedSure) {
			notify.error("スレが開かれていません");
			return;
		}
		this.trigger("openForm", {
			submitType: "resList",
			sure: this.openedSure,
			initBody: initBody
		});
	}

	private popup(reses: PopupRes[], target: Element) {
		const popupHtml = `
		<div class="res-popups">
			${TemplateUtil.each(reses , (item) =>
				this.resTemplate(item.res, `res-popup-nest-${item.nestCount}`)
			)}
		</div>`;
		const popupElem = ComponentScanner.scanHtml(popupHtml);
		this.addClickEvent(popupElem);
		new Popup({
			innerElement: popupElem,
			target: target
		});
	}

	private setResCollection(sure: SureModel, resList: ResModel[]) {
		this.resModels = resList;
		this._title = `${sure.board.displayName} - ${sure.titleName} (${resList.length})`;
		this.trigger("changeTitle", this._title);
	}

	private search(text: string) {
		if (text === "") {
			this.filter("all");
		} else {
			this.filter("search", text);
		}
	};

	private convertResElements(reses: ResModel[]): HTMLElement[] {
		const html = TemplateUtil.each(reses, (res, i) => this.resTemplate(res));
		return ComponentScanner.scanHtmls(html);
	}
}