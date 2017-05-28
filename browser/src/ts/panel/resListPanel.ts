import { alertMessage } from '../common/utils';
import { notify } from '../common/libs';
import { Popup } from '../common/popup';
import { PopupRes } from 'service/resListService';
import { SureTable } from 'database/tables';
import { SureModel } from 'model/sureModel';
import { ResModel } from 'model/resModel';
import { tmpl, ElemUtil } from 'common/commons';
import { ComponentScanner } from 'component/scanner';
import { Button, SearchText, Dropdown} from 'component/components';
import { ButtonOption, SearchTextOption, DropdownOption, MenuButtonOption } from 'component/components';
import { resListService } from 'service/resListService';
import { Panel, PanelType } from './basePanel';
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
export class ResListPanel extends Panel<ResListPanelEvent, ResListStorage> {
	private _content: Element;
	private _openedSure: SureModel | undefined;
	private _resCollection: ResModel[];

	public get panelType(): PanelType {
		return "resList";
	}

	// components
	private readonly _backButton: Button;
	private readonly _refreshButton: Button;
	private readonly _createButton: Button;
	private readonly _filterDropdown: Dropdown;
	private readonly _searchText: SearchText;
	private readonly _urlButton: Button;
	private readonly _menuButton: MenuButton;

	private template() {
		return `
			<div class="panel-container panel-res-list">
				<div class="panel-command-bar">
					${this._backButton.html()}
					${this._refreshButton.html()}
					${this._createButton.html()}
					${this._filterDropdown.html()}
					${this._searchText.html()}
					${this._urlButton.html()}
					${this._menuButton.html()}
				</div>
				<div class="panel-content">
				</div>
			</div>
		`;
	}

	private resListTemplate(reses: ResModel[]) {
		return tmpl.each(reses, res => this.resTemplate(res));
	}

	private resTemplate(res: ResModel, className?: string) {
		return `
		<div class="res-container ${className || ""}">
			<div class="res-header">
				<span class="res-no ${res.getResColor()} ${tmpl.when(res.isNew, () => "res-new")}"
					res-index = "${res.index}"
				 >
					${res.index + 1}${res.getIndexFormat()}
				</span>
				<span class="res-name">
					名前: ${res.name}
				</span>
				<span class="res-postdate">
					${res.postDate}
				</span>
				${tmpl.when(res.userId, () => `
					<span class="res-user-id ${res.getIdColor()}" res-index="${res.index}">
						ID:${res.userId} (${res.getIdCountFormat()})
					</span>
				`)}
				${tmpl.when(res.userBe, () => `
					<span class="res-user-be">
						BE:${res.userBe!.displayName}
					</span>
				`)}
			</div>
			<div class="res-body">
				${res.body}
			</div>
		</div>
		`;
	}
	constructor() {
		super();
		this._backButton = new Button(this.getBackButtonOption());
		this._refreshButton = new Button(this.getRefreshButtonOption());
		this._createButton = new Button(this.getSubmitButtonOption());
		this._searchText = new SearchText(this.getSearchTextOption());
		this._filterDropdown = new Dropdown(this.getDropdownOption());
		this._urlButton = new Button({
			icon: "icon-link",
			label: "URL",
			className: "url-button",
			onClick: () => alertMessage("info", "未実装")
		});
		this._menuButton = new MenuButton(this.getMenuButtonOption());
		this._el = ComponentScanner.scanHtml(this.template());
		this._content = this._el.querySelector(".panel-content")!;
		this.addClickEvent(this._content);
	}

	public async init() {
		if (this._storage.sureId !== null) {
			try {
				const sureModel = await SureModel.createInstanceFromId(this._storage.sureId);
				const resList = await resListService.getResListFromCache(sureModel);
				this.changeResList(sureModel, resList);
			} catch (error) {
				this._storage.sureId = null;
				console.warn(error);
			}
		}
	}

	private addClickEvent(parent: Element) {
		ElemUtil.addDelegateEventListener(parent, "click", ".res-no", (e, current) => {
			const index = current.getAttribute("res-index");
			if (index === null) {
				throw new Error();
			}
			const result = resListService.deepSearchAnker(this._resCollection, +index);
			this.popup(result, current);
		});
		ElemUtil.addDelegateEventListener(parent, "click", ".res-anker", (e, current) => {
			const index = current.getAttribute("anker-to");
			if (index === null) {
				throw new Error();
			}
			const res = this._resCollection[+index];
			if (!res) {
				return;
			}
			this.popup([{nestCount: 0, res: res}], current);
		});

		ElemUtil.addDelegateEventListener(parent, "click", ".res-user-id", (e, current) => {
			const index = current.getAttribute("res-index");
			if (index === null) {
				throw new Error();
			}
			const userResIndexes = this._resCollection[+index].userIndexes;
			const userReses = userResIndexes.map<PopupRes>(index => ({nestCount: 0, res: this._resCollection[index]}));
			this.popup(userReses, current);
		});
	}

	/** @override */
	protected getStorageForSave(): ResListStorage {
		return {
			sureId: this._openedSure ? this._openedSure.id : null
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

	private getMenuButtonOption(): MenuButtonOption {
		return {
			items: [
				{
					label: "ログを削除",
					onSelect: () => this.deleteLog()
				}, {
					label: "次スレを検索",
					onSelect: () => alertMessage("info", "未実装")
				}, {
					label: "板を開く",
					onSelect: () => alertMessage("info", "未実装")
				}, {
					label: "ブラウザで開く",
					onSelect: () => alertMessage("info", "未実装")
				}
			]
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

	private reload() {
		if (this._openedSure) {
			this.changeResListFromServer(this._openedSure);
		}
	}

	private async deleteLog() {
		if (this._openedSure) {
			const sure = this._openedSure;
			this._content.innerHTML = "";
			this._openedSure = undefined;
			this._resCollection = [];
			this._title = "";
			await resListService.deleteSure(sure);
			this.trigger("changeSure", sure);
			this.trigger("changeTitle", "");
		}
	}

	private filter(type: FilterType) {
		if (!this._resCollection) {
			return;
		}
		let reses: ResModel[] = this._resCollection;
		switch (type) {
		case "none":
			break;
		case "popularity":
			reses = this._resCollection.filter(res => res.fromAnkers.length >= 3);
			break;
		case "image": // TODO
		case "link": // TODO
			alertMessage("info", "未実装");
			break;
		}
		this.reRender(reses);
		return;
	}

	private openForm() {
		if (!this._openedSure) {
			notify.error("スレが開かれていません");
			return;
		}
		this.trigger("openForm", {
			submitType: "resList",
			sure: this._openedSure
		});
	}

	public async changeResListFromServer(sure: SureModel) {
		const isChangeSure = !sure.equal(this._openedSure);
		const resList = await resListService.getResListFromServer(sure);
		this.changeResList(sure, resList);
		this.trigger("changeSure", sure);
		if (isChangeSure) {
			this._content.scrollTop = 0;
		}
	}

	private popup(reses: PopupRes[], target: Element) {
		const popupHtml = `
		<div class="res-popups">
			${tmpl.each(reses , (item) =>
				this.resTemplate(item.res, `res-popup-nest-${item.nestCount}`)
			)}
		</div>`;
		const popupElem = ElemUtil.parseDom(popupHtml);
		this.addClickEvent(popupElem);
		new Popup(popupElem, target);
	}

	private changeResList(sure: SureModel, resList: ResModel[]) {
		this._resCollection = resList;
		this._title = `${sure.board.displayName} - ${sure.titleName}`;
		this.trigger("changeTitle", this._title);
		this._openedSure = sure;
		this.reRender(resList);
	}

	private search(text: string) {
		if (!this._resCollection) {
			return;
		}
		const reses = this._resCollection.filter(res => res.body.match(text) !== null);
		this.reRender(reses);
	};

	private reRender(reses: ResModel[]) {
		this._content.innerHTML = this.resListTemplate(reses);
	}
}