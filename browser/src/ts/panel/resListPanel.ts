import { notify } from '../commons/libs';
import { Popup } from '../commons/popup';
import { PopupRes } from '../nichan/service/resListService';
import { SureAttr } from 'database/tables';
import { tmpl, StorageType, ElemUtil } from 'commons/commons';
import { ResAttr } from 'nichan/interfaces';
import { ComponentScanner } from 'component/scanner';
import { Button, SearchText, Dropdown} from 'component/components';
import { ButtonOption, SearchTextOption, DropdownOption} from 'component/components';
import { resListService } from 'nichan/service/resListService';
import { SureModel } from 'nichan/model/sureModel';
import { BasePanelEvent, Panel } from './basePanel';
import { PanelType } from "tofu/tofuDefs";
import { OpenFormOption } from "panel/formPanel";
import { emoji } from "commons/emoji";

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
	private _allResList: ResAttr[];
	private _displayResList: ResAttr[];

	public get panelType(): PanelType {
		return "res";
	}
	// components
	private readonly _backButton: Button;
	private readonly _refreshButton: Button;
	private readonly _createButton: Button;
	private readonly _filterDropdown: Dropdown;
	private readonly _searchText: SearchText;

	private template() {
		return `
			<div class="panel-container panel-res-list">
				<div class="panel-command-bar">
					${this._backButton.html()}
					${this._refreshButton.html()}
					${this._createButton.html()}
					${this._filterDropdown.html()}
					${this._searchText.html()}
				</div>
				<div class="panel-content">
				</div>
			</div>
		`;
	}

	private resListTemplate() {
		return tmpl.each(this._displayResList, res => this.resTemplate(res));
	}

	private resTemplate(res: ResAttr, className?: string) {
		return `
		<div class="res-container ${className || ""}">
			<div class="res-header">
				<span class="res-no ${res.noColor} ${tmpl.when(res.isNew, () => "res-new")}"
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
					<span class="res-user-id ${res.idColor}">
						ID:${res.userId} (${res.idCount})
					</span>
				`)}
				${tmpl.when(res.userBe, () => `
					<span class="res-user-be">
						BE:${res.userBe!.displayName}
					</span>
				`)}
			</div>
			<div class="res-body">
				${emoji.replace(res.body)}
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
		this._el = ComponentScanner.scanHtml(this.template());
		this._content = this._el.querySelector(".panel-content")!;
	}

	public async init() {
		this.addDomEvent(this._content);
		if (this._storage.sure) {
			const sureModel  = await resListService.attrToModel(this._storage.sure);
			const resList = await resListService.getResListFromCache(sureModel);
			this.setResList(sureModel, resList);
		}
	}

	private addDomEvent(parent: Element) {
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
			this.popup([{nestCount: 0, res: this._allResList[+index -1]}], current);
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
			onClick: () => this.openSure(this._openedSure!)
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
	public async openSure(sure: SureModel) {
		const mode = !sure.equal(this._openedSure) ? "fetch" : "reload";
		const resList = await resListService.getResListFromServer(sure, mode);
		this.setResList(sure, resList);
		this.trigger("changeSure", sure);
		if (mode === "fetch") {
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
		this.addDomEvent(popupElem);
		new Popup(popupElem, target);

	}

	private setResList(sure: SureModel, resList: ResAttr[]) {
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