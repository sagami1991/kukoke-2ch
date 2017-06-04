import { contextMenuController } from '../common/contextmenu';
import { VirtualScrollView, VirtualScrillViewOption } from "common/virtualScrollView/virtualScrollView";
import { alertMessage } from '../common/utils';
import { notify, electron } from '../common/libs';
import { Popup } from '../common/popup';
import { IPopupRes } from 'service/resListService';
import { SureTable } from 'database/tables';
import { SureModel } from 'model/sureModel';
import { ResModel } from 'model/resModel';
import { templateUtil, ElementUtil } from 'common/commons';
import { ComponentScanner } from 'component/scanner';
import { Button, SearchText, Dropdown} from 'component/components';
import { ButtonOption, SearchTextOption, DropdownOption, MenuButtonOption, ImageThumbnail } from 'component/components';
import { resListService } from 'service/resListService';
import { Panel, TPanelType } from './basePanel';
import { OpenFormOption } from "panel/formPanel";
import { MenuButton } from "component/menuButton";

interface ResListStorage {
	sureId: number | null;
}

interface ResListPanelEvent {
	"changeSure": SureModel;
	"openForm": OpenFormOption;
}

type FilterType = "none" | "popularity" | "image" | "link";
type RefreshMode = "reload" | "change";
type RenderMode = "all" | "filtering";
export class ResListPanel extends Panel<ResListPanelEvent, ResListStorage> {
	private readonly content: HTMLElement;
	private openedSure: SureModel | undefined;
	private resCollection: ResModel[];
	private renderMode: RenderMode;
	public get panelType(): TPanelType {
		return "resList";
	}

	// components
	private readonly virtialResList: VirtualScrollView;
	private readonly backButton: Button;
	private readonly refreshButton: Button;
	private readonly createButton: Button;
	private readonly filterDropdown: Dropdown;
	private readonly searchText: SearchText;
	private readonly urlButton: Button;
	private readonly menuButton: Button;

	private template() {
		return `
			<div class="panel-container panel-res-list">
				<div class="panel-command-bar">
					${this.backButton.html()}
					${this.refreshButton.html()}
					${this.createButton.html()}
					${this.filterDropdown.html()}
					${this.searchText.html()}
					${this.urlButton.html()}
					${this.menuButton.html()}
				</div>
				<div class="panel-content">
				</div>
			</div>
		`;
	}


	private resTemplate(res: ResModel, className?: string) {
		return `` +
		`<div class="res-container ${className || ""}" res-index = "${res.index}">` +
			`<div class="res-header">` +
				`<span class="res-no ${res.getResColor()} ${templateUtil.when(res.isNew, () => "res-new")}" ` +
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
				`${templateUtil.when(res.userId, () => `` +
					`<span class="res-user-id ${res.getIdColor()}" res-index="${res.index}">` +
						`ID:${res.userId} (${res.getIdCountFormat()})` +
					`</span>`
				)}` +
				`${templateUtil.when(res.userBe, () => `` +
					`<span class="res-user-be">` +
						`BE:${res.userBe!.displayName}` +
					`</span>`
				)}` +
			`</div>` +
			`<div class="res-body">` +
				`${res.body}` +
			`</div>` +
			`<div class="res-thumbnails">${
				templateUtil.each(res.imageUrls, url =>
					new ImageThumbnail({url: url}).html()
				)}
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
			onClick: () => alertMessage("info", "未実装")
		});
		this.menuButton = new Button(this.getMenuButtonOption());
		this._el = ComponentScanner.scanHtml(this.template());
		this.content = <HTMLElement> this._el.querySelector(".panel-content");
		this.addClickEvent(this.content);
		this.virtialResList = new VirtualScrollView(this.getVirtualListOption())
	}

	public async init() {
		if (this._storage.sureId !== null) {
			try {
				this.openedSure = await SureModel.createInstanceFromId(this._storage.sureId);
				const resList = await resListService.getResListFromCache(this.openedSure);
				this.setResCollection(this.openedSure, resList);
				this.virtialResList.changeContents(this.getElems(resList), this.openedSure.bookmarkIndex);
			} catch (error) {
				this._storage.sureId = null;
				console.error(error);
			}
		}
	}

	public async saveStorage() {
		super.saveStorage();
		await this.saveBookMark();
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
			const result = resListService.deepSearchAnker(this.resCollection, +index);
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
			const res = this.resCollection[+index];
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
			const userResIndexes = this.resCollection[+index].userIndexes;
			const userReses = userResIndexes.map<IPopupRes>(index => ({nestCount: 0, res: this.resCollection[index]}));
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
			onClick: () => this.reload()
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
			defaultItem: {
				icon: "icon-filter",
				label: "フィルター"
			},
			items: [
				{
					label: "フィルターなし",
					id: "none"
				}, {
					label: "人気レス",
					id: "popularity"
				}, {
					label: "画像レス",
					id: "image"
				}, {
					label: "リンクレス",
					id: "link"

				}
			],
			onSelect: (filterType) => this.filter(filterType)
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

	private async reload() {
		if (this.openedSure) {
			const resList = await resListService.getResListFromServer(this.openedSure);
			this.setResCollection(this.openedSure, resList);
			this.virtialResList.changeContentsWithKeep(this.getElems(resList));
			this.renderMode = "all";
		}
	}

	private async deleteLog() {
		if (this.openedSure) {
			const sure = this.openedSure;
			this.virtialResList.empty();
			this.openedSure = undefined;
			this.resCollection = [];
			this._title = "";
			await resListService.deleteSure(sure);
			this.trigger("changeSure", sure);
			this.trigger("changeTitle", "");
		}
	}

	private filter(type: FilterType) {
		if (!this.openedSure || !this.resCollection) {
			return;
		}
		let reses: ResModel[] = this.resCollection;
		switch (type) {
		case "none":
			this.virtialResList.changeContents(this.getElems(reses), this.openedSure.bookmarkIndex);
			this.renderMode = "all";
			break;
		case "popularity":
			reses = this.resCollection.filter(res => res.fromAnkers.length >= 3);
			this.saveBookMark();
			this.virtialResList.changeContents(this.getElems(reses));
			this.renderMode = "filtering";
			break;
		case "image": // TODO
		case "link": // TODO
			alertMessage("info", "未実装");
			break;
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

	public async openSure(sure: SureModel) {
		this.saveBookMark();
		this.openedSure = sure;
		this.renderMode = "all";
		const resList = await resListService.getResListFromServer(sure);
		this.setResCollection(sure, resList);
		this.virtialResList.changeContents(this.getElems(resList), sure.bookmarkIndex);
		this.trigger("changeSure", sure);
	}

	private popup(reses: IPopupRes[], target: Element) {
		const popupHtml = `
		<div class="res-popups">
			${templateUtil.each(reses , (item) =>
				this.resTemplate(item.res, `res-popup-nest-${item.nestCount}`)
			)}
		</div>`;
		const popupElem =ComponentScanner.scanHtml(popupHtml);
		this.addClickEvent(popupElem);
		new Popup(popupElem, target);
	}

	private setResCollection(sure: SureModel, resList: ResModel[]) {
		this.resCollection = resList;
		this._title = `${sure.board.displayName} - ${sure.titleName} (${resList.length})`;
		this.trigger("changeTitle", this._title);
	}

	private search(text: string) {
		if (!this.openedSure || !this.resCollection) {
			return;
		}
		if (text === "") {
			this.virtialResList.changeContents(this.getElems(this.resCollection), this.openedSure.bookmarkIndex);
			this.renderMode = "all";
			return;
		}
		this.saveBookMark();
		const reses = this.resCollection.filter(res => res.body.match(text) !== null);
		this.virtialResList.changeContents(this.getElems(reses));
		this.renderMode = "filtering";
	};

	private getElems(reses: ResModel[]) {
		return reses.map(res => ComponentScanner.scanHtml(this.resTemplate(res)));
	}
}