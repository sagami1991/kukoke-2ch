import { toHighlightHtml } from "../common/commons";
import { SureTable } from '../database/tables';
import { contextMenuController } from '../common/contextmenu';
import { boardRepository } from '../database/boardRepository';
import { TemplateUtil } from 'common/commons';
import { List, Button, SearchText} from 'component/components';
import { ListOption , ButtonOption, SearchTextOption } from 'component/components';
import { ComponentScanner } from 'component/scanner';
import { sureListService } from 'service/sureListService';
import { resListService } from 'service/resListService';
import { SureModel } from 'model/sureModel';
import { Panel, PanelType } from './basePanel';
import { BoardTable } from "database/tables";
import { emojiUtil } from "common/emoji";
import { electron } from "common/libs";
import { BbsMenuPanel } from "panel/bbsMenuPanel";

interface SureListStorage {
	boardId: number | null;
	sortKey: keyof SureModel | undefined;
}

interface SureListPanelEvent {
	openSure: SureModel;
}
export class SureListPanel extends Panel<SureListPanelEvent, SureListStorage> {
	private _sures: SureModel[];
	private _openedBoard: BoardTable | undefined;

	public get panelType(): PanelType {
		return "sureList";
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
				<div class="panel-layer"></div>
				<div class="panel-command-bar">
					${this._backButton.html()}
					${this._reloadButton.html()}
					${this._createButton.html()}
					${this._searchText.html()}
					<div class="panel-loading-bar"></div>
				</div>
				<div class="panel-content">
					${this._list.html()}
				</div>
			</div>
		`;
	}

	constructor() {
		super();
		this._backButton = new Button(this.getBackButtonOption());
		this._reloadButton = new Button(this.getReloadButtonOption());
		this._createButton = new Button(this.getWriteButtonOption());
		this._searchText = new SearchText(this.getSearchTextOption());
		this._list = new List<SureModel>(this.getListOption());
		this._el = ComponentScanner.scanHtml(this.template());
	}

	public async init() {
		let board: BoardTable | undefined;
		if (this.storage.boardId !== null) {
			board = await boardRepository.getBoard(this.storage.boardId);
		}
		if (board === undefined) {
			board = BbsMenuPanel.getRecentOpenSure();
		}
		await this.reload(board, "localDb");
		this._openedBoard = board;
	}

	/** @override */
	protected getStorageForSave(): SureListStorage {
		return {
			boardId: this._openedBoard ? this._openedBoard.id : null,
			sortKey: this._list.nowSortKey
		};
	}

	/** @override */
	protected getDefaultStorage(): SureListStorage {
		return {
			boardId: null,
			sortKey: undefined
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

	private getReloadButtonOption(): ButtonOption {
		return {
			icon: "icon-reload",
			iconSize: "m",
			style: "icon-only",
			onClick: () => {
				if (this._openedBoard) {
					this.reload(this._openedBoard, "server");
				}
			}
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
			placeholder: "スレタイを検索",
			onChange: () => this._list.changeData(this.getSearchedSures())
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
					parse: (sure) => emojiUtil.replace(toHighlightHtml(sure.titleName, this._searchText.getValue())), // TODO エスケープ済みっぽいが危険
					className: (sure) => `sure-suretai ${!sure.enabled ?  "sure-oti" : sure.saved ? "sure-saved" : ""}`,
					width: 400,
					tooltip: (sure) => sure.board.displayName
				}, {
					label: "レス",
					parse: (sure) => "" + sure.resCount,
					className: (sure) => `sure-length`,
					width: 50
				}, {
					label: "勢い",
					parse: (sure) => TemplateUtil.numberFormat(sure.ikioi, 1),
					className: (sure) => `sure-ikioi ikioi-color-${sure.ikioiColor}`,
					width: 80,
					sortKey: "ikioi"
				}, {
					label: "日付",
					parse: (sure) => TemplateUtil.dateFormat(sure.createdAt),
					className: () => "sure-created-at",
					width: 140,
					sortKey: "createdAt"
				}
			],
			onRowClick: (sure) => this.trigger("openSure", sure),
			onRowRightClick: (sure) => {
				contextMenuController.addMenu([{
					label: "ログを削除",
					click: async () => {
						await resListService.deleteSure(sure);
						await this.reload(this._openedBoard!, "localDb");
					}
				},{
					label: "ブラウザで開く",
					click: () => electron.shell.openExternal(sure.getSureUrl())
				}]);
			},
			sortKey: this.storage.sortKey
		};
	}

	public async openBoard(board: BoardTable) {
		await this.reload(board, "server");
		this._openedBoard = board;
	}

	/** @override */
	public onChangeSize() {
		this._list.changeParentSize();
	}

	private async reload(board: BoardTable, mode: "recent" | "localDb" | "server") {
		if (board.type === "recentOpen") {
			mode = "recent";
		}
		await this.loadingTransaction(async () => {
			let sureModels: SureModel[] | undefined;
			switch (mode) {
				case "recent":
					sureModels = await sureListService.getRecentOpenSures();
					break;
				case "localDb":
					sureModels = await sureListService.getSuresFromDb(board);
					break;
				case "server":
					sureModels = await sureListService.getSuresFromNichan(board);
					break;
			}
			this._sures = sureModels!;
			const isKeep = this._openedBoard === board && (mode === "localDb" || mode === "recent");
			this._list.changeData(sureModels!, isKeep, mode === "recent");
			this.trigger("changeTitle", board.displayName);
		}, {
			delayLockKey: mode === "server" ? board.id : undefined
		});
	}

	public async onChangeSureModel(sure: SureModel) {
		if (this._openedBoard && (this._openedBoard.type === "recentOpen" || this._openedBoard.path === sure.board.path)) {
			const targetSure = this._sures.find(s => s.id === sure.id);
			if (targetSure) {
				targetSure.enabled = sure.enabled;
				targetSure.saved = sure.saved;
				targetSure.resCount = sure.resCount;
				targetSure.savedResCount = sure.savedResCount;
			}
			this._list.changeData(this.getSearchedSures(), true);
		}
	}

	private getSearchedSures(): Array<SureModel> {
		const text = this._searchText.getValue();
		if (!this._sures) {
			return [];
		}
		if (!text) {
			return this._sures;
		}
		const regexp = new RegExp(text, "i");
		return this._sures.filter(sure => sure.titleName.toLowerCase().match(regexp) !== null);
	}


 }