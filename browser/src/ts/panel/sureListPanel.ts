import { tmpl } from 'common/commons';
import { List, Button, SearchText} from 'component/components';
import { ListOption , ButtonOption, SearchTextOption } from 'component/components';
import { ComponentScanner } from 'component/scanner';
import { sureListService } from 'service/sureListService';
import { SureModel } from 'model/sureModel';
import { Panel } from './basePanel';
import { BoardAttr } from "database/tables";
import { PanelType } from "tofu/tofuDefs";
import { emoji } from "common/emoji";

interface SureListStorage {
	board: BoardAttr | null;
}

interface SureListPanelEvent {
	openSure: SureModel;
}
export class SureListPanel extends Panel<SureListPanelEvent, SureListStorage> {
	private _sures: SureModel[];
	private _displaySures: SureModel[];
	private _openedBoard: BoardAttr | null;

	public get panelType(): PanelType {
		return "sure";
	}
	// components
	private readonly _backButton: Button;
	private readonly _reloadButton: Button;
	private readonly _createButton: Button;
	private readonly _searchText: SearchText;
	private readonly _list: List<SureModel>;

	private template() {
		return `
			<div class="panel-container panel-sure-list">
				<div class="panel-command-bar">
					${this._backButton.html()}
					${this._reloadButton.html()}
					${this._createButton.html()}
					${this._searchText.html()}
				</div>
				<div class="panel-content">
					${this._list.html()}
				</div>
			</div>
		`;
	}

	constructor() {
		super();
		this._openedBoard = this._storage.board;
		this._title = this._openedBoard ? this._openedBoard.displayName : "";
		this._backButton = new Button(this.getBackButtonOption());
		this._reloadButton = new Button(this.getReloadButtonOption());
		this._createButton = new Button(this.getWriteButtonOption());
		this._searchText = new SearchText(this.getSearchTextOption());
		this._list = new List<SureModel>(this.getListOption());
		this._el = ComponentScanner.scanHtml(this.template());
	}

	public async init() {
		await this.refreshFromDb();
	}

	/** @override */
	protected getStorageForSave(): SureListStorage {
		return {
			board: this._openedBoard
		};
	}

	/** @override */
	protected getDefaultStorage(): SureListStorage {
		return {
			board: null
		};
	}

	private getBackButtonOption(): ButtonOption {
		return {
			icon: "icon-navigate-back",
			iconSize: "m",
			style: "icon-only",
			onClick: () => alert("未実装")
		}
	}

	private getReloadButtonOption(): ButtonOption {
		return {
			icon: "icon-reload",
			iconSize: "m",
			style: "icon-only",
			onClick: () => this.reload()
		};
	}

	private getWriteButtonOption(): ButtonOption {
		return {
			icon: "icon-pen",
			iconSize: "m",
			style: "icon-only",
			onClick: () => alert("未実装")
		};
	}

	private getSearchTextOption(): SearchTextOption {
		return {
			width: 160,
			placeholder: "スレ名",
			onChange: (text) => this.search(text)
		};
	}

	private getListOption(): ListOption<SureModel> {
		return {
			array: [],
			cellOptions: [
				{
					label: "新着",
					parse: (sure) => {
						if (sure.savedResCount && sure.resCount > sure.savedResCount) {
							return `<span class="sure-new">${sure.resCount - sure.savedResCount}</span>`;
						} else {
							return "";
						}
					},
					className: () => "sure-td-new",
					width: 40
				},
				{
					label: "スレタイ",
					parse: (sure) => emoji.replace(sure.titleName), // TODO エスケープ済みっぽいが危険
					className: (sure) => `sure-suretai ${sure.saved ? "sure-saved" : ""}`,
					width: 400
				}, {
					label: "レス",
					parse: (sure) => "" + sure.resCount,
					className: (sure) => `sure-length`,
					width: 50
				}, {
					label: "勢い",
					parse: (sure) => tmpl.numberFormat(sure.ikioi, 1),
					className: (sure) => `sure-ikioi ikioi-color-${sure.ikioiColor}`,
					width: 80
				}, {
					label: "日付",
					parse: (sure) => tmpl.dateFormat(sure.createdAt),
					className: () => "sure-created-at",
					width: 100
				}
			],
			onRowClick: (sure) => this.trigger("openSure", sure)
		};
	}

	private async refreshFromDb() {
		if (this._openedBoard) {
			const sureCollection = await sureListService.getSuresFromDb(this._openedBoard);
			this.changeSureCollection(sureCollection);
		}
	}

	private async reload() {
		if (this._openedBoard) {
			const sureCollection = await sureListService.getSuresFromNichan(this._openedBoard);
			this.changeSureCollection(sureCollection);
		}
	}

	public async openBoard(board: BoardAttr) {
		this._openedBoard = board;
		const sureCollection = await sureListService.getSuresFromNichan(board);
		this.changeSureCollection(sureCollection);
		this.trigger("changeTitle", this._title);
	}

	public async changeSure(sure: SureModel) {
		if (this._openedBoard && this._openedBoard.path === sure.board.path) {
			await this.refreshFromDb();
		}
	}

	private changeSureCollection(sures: SureModel[]) {
		this._sures = sures;
		this._displaySures = sures;
		this._list.changeArray(this._displaySures);
	}

	private search(text: string) {
		if (!this._sures) {
			return;
		}
		this._displaySures = this._sures.filter(sure => sure.titleName.match(text) !== null);
		this._list.changeArray(this._displaySures);
	};


 }