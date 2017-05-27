import { notify } from '../common/libs';
import { Popup } from '../common/popup';
import { PopupRes } from 'service/resListService';
import { SureAttr } from 'database/tables';
import { SureModel } from 'model/sureModel';
import { ResModel } from 'model/resModel';
import { tmpl, ElemUtil } from 'common/commons';
import { ComponentScanner } from 'component/scanner';
import { Button, SearchText, Dropdown} from 'component/components';
import { ButtonOption, SearchTextOption, DropdownOption} from 'component/components';
import { resListService } from 'service/resListService';
import { Panel } from './basePanel';
import { PanelType } from "tofu/tofuDefs";
import { OpenFormOption } from "panel/formPanel";

interface ResListStorage {
	sure: SureAttr | null;
}

interface ResListPanelEvent {
	"changeSure": SureModel;
	"openForm": OpenFormOption;
}
export class ResListPanel extends Panel<ResListPanelEvent, ResListStorage> {
	private _content: Element;
	private _openedSure: SureModel | undefined;
	private _allResList: ResModel[];
	private _displayResList: ResModel[];

	public get panelType(): PanelType {
		return "res";
	}
	// components
	private readonly _backButton: Button;
	private readonly _refreshButton: Button;
	private readonly _createButton: Button;
	private readonly _filterDropdown: Dropdown;
	private readonly _searchText: SearchText;
	private readonly _deleteButton: Button;

	private template() {
		return `
			<div class="panel-container panel-res-list">
				<div class="panel-command-bar">
					${this._backButton.html()}
					${this._refreshButton.html()}
					${this._createButton.html()}
					${this._filterDropdown.html()}
					${this._searchText.html()}
					${this._deleteButton.html()}
				</div>
				<div class="panel-content">
				</div>
			</div>
		`;
	}

	private resListTemplate() {
		return tmpl.each(this._displayResList, res => this.resTemplate(res));
	}

	private resTemplate(res: ResModel, className?: string) {
		return `
		<div class="res-container ${className || ""}">
			<div class="res-header">
				<span class="res-no ${res.getResColor()} ${tmpl.when(res.isNew, () => "res-new")}"
					res-index = "${res.index}"
				 >
					${res.index + 1}
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
		this._title = "";
		this._backButton = new Button(this.getBackButtonOption());
		this._refreshButton = new Button(this.getRefreshButtonOption());
		this._createButton = new Button(this.getSubmitButtonOption());
		this._searchText = new SearchText(this.getSearchTextOption());
		this._filterDropdown = new Dropdown(this.getDropdownOption());
		this._deleteButton = new Button(this.getDeleteButtonOption());
		this._el = ComponentScanner.scanHtml(this.template());
		this._content = this._el.querySelector(".panel-content")!;
	}

	public async init() {
		this.addClickEvent(this._content);
		if (this._storage.sure) {
			const sureModel  = await resListService.attrToModel(this._storage.sure);
			const resList = await resListService.getResListFromCache(sureModel);
			this.changeResList(sureModel, resList);
		}
	}

	private addClickEvent(parent: Element) {
		ElemUtil.addDelegateEventListener(parent, "click", ".res-no", (e, current) => {
			const index = current.getAttribute("res-index");
			if (index === null) {
				throw new Error();
			}
			const result = resListService.deepSearchAnker(this._allResList, +index);
			this.popup(result, current);
		});
		ElemUtil.addDelegateEventListener(parent, "click", ".res-anker", (e, current) => {
			const index = current.getAttribute("anker-to");
			if (index === null) {
				throw new Error();
			}
			const res = this._allResList[+index];
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
			const userResIndexes = this._allResList[+index].userIndexes;
			const userReses = userResIndexes.map<PopupRes>(index => ({nestCount: 0, res: this._allResList[index]}));
			this.popup(userReses, current);
		});
	}

	/** @override */
	protected getStorageForSave(): ResListStorage {
		return {
			sure: this._openedSure ? this._openedSure.toJSON() : null
		};
	}

	/** @override */
	protected getDefaultStorage(): ResListStorage {
		return {
			sure: null
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
			onClick: () => this.changeResListFromServer(this._openedSure!)
		};
	}

	private getDeleteButtonOption(): ButtonOption {
		return {
			icon: "icon-delete-forever",
			style: "icon-only",
			onClick: () => ""
		};
	}

	private getSearchTextOption(): SearchTextOption {
		return {
			width: 160,
			placeholder: "本文",
			onChange: (text) => this.search(text)
		};
	}

	private getDropdownOption(): DropdownOption {
		return {
			defaultItem: {
				icon: "icon-filter",
				label: "フィルター"
			},
			items: [
				{
					label: "人気レス"
				}, {
					label: "画像レス"
				}, {
					label: "リンクレス"
				}
			],
			onSelect: () => alert("未実装")
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


	private openForm() {
		if (!this._openedSure) {
			notify.error("スレが開かれていません");
			return;
		}
		this.trigger("openForm", {
			submitType: "res",
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
		this._allResList = resList;
		this._displayResList = this._allResList;
		this._content.innerHTML = this.resListTemplate();
		this._title = `${sure.board.displayName} - ${sure.titleName}`;
		this.trigger("changeTitle", this._title);
		this._openedSure = sure;
	}

	private search(text: string) {
		if (!this._allResList) {
			return;
		}
		this._displayResList = this._allResList.filter(res => res.body.match(text) !== null);
		this._content.innerHTML = "";
		this._content.innerHTML = this.resListTemplate();
	};
}