import { contextMenuController } from '../common/contextmenu';
import { boardRepository } from '../database/boardRepository';
import { templateUtil } from 'common/commons';
import { List, Button, SearchText} from 'component/components';
import { ListOption , ButtonOption, SearchTextOption } from 'component/components';
import { ComponentScanner } from 'component/scanner';
import { sureListService } from 'service/sureListService';
import { SureModel } from 'model/sureModel';
import { Panel, TPanelType } from './basePanel';
import { BoardTable } from "database/tables";
import { emojiUtil } from "common/emoji";
import { electron } from "common/libs";

interface SureListStorage {
	boardId: number | null;
}

interface SureListPanelEvent {
	openSure: SureModel;
}
export class SureListPanel extends Panel<SureListPanelEvent, SureListStorage> {
	private _sures: SureModel[];
	private _openedBoard: BoardTable | undefined;

	public get panelType(): TPanelType {
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
		this._backButton = new Button(this.getBackButtonOption());
		this._reloadButton = new Button(this.getReloadButtonOption());
		this._createButton = new Button(this.getWriteButtonOption());
		this._searchText = new SearchText(this.getSearchTextOption());
		this._list = new List<SureModel>(this.getListOption());
		this._el = ComponentScanner.scanHtml(this.template());
	}

	public async init() {
		if (this._storage.boardId !== null) {
			const board = await boardRepository.getBoard(this._storage.boardId);
			if (board) {
				await this.refreshFromDb(board);
			}
		} else {
			await this.openRecent();
		}
	}

	/** @override */
	protected getStorageForSave(): SureListStorage {
		return {
			boardId: this._openedBoard ? this._openedBoard.id : null
		};
	}

	/** @override */
	protected getDefaultStorage(): SureListStorage {
		return {
			boardId: null
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
			placeholder: "スレタイを検索",
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
					parse: (sure) => emojiUtil.replace(sure.titleName), // TODO エスケープ済みっぽいが危険
					className: (sure) => `sure-suretai ${!sure.enabled ?  "sure-oti" : sure.saved ? "sure-saved" : ""}`,
					width: 400
				}, {
					label: "レス",
					parse: (sure) => "" + sure.resCount,
					className: (sure) => `sure-length`,
					width: 50
				}, {
					label: "勢い",
					parse: (sure) => templateUtil.numberFormat(sure.ikioi, 1),
					className: (sure) => `sure-ikioi ikioi-color-${sure.ikioiColor}`,
					width: 80
				}, {
					label: "日付",
					parse: (sure) => templateUtil.dateFormat(sure.createdAt),
					className: () => "sure-created-at",
					width: 100
				}
			],
			onRowClick: (sure) => this.trigger("openSure", sure),
			onRowRightClick: (sure) => {
				contextMenuController.addMenu([{
					label: "ブラウザで開く",
					click: () => electron.shell.openExternal(sure.getSureUrl())
				}]);
			},
		};
	}

	public async openBoard(board: BoardTable) {
		const sureCollection = await sureListService.getSuresFromNichan(board);
		this.changeSureCollection(sureCollection, board, board.displayName);
	}

	public async openRecent() {
		const sureCollection = await sureListService.getRecentOpenSures();
		this.changeSureCollection(sureCollection, undefined, "最近開いたスレ");
	}

	private async reload() {
		if (this._openedBoard) {
			const board = this._openedBoard;
			const sureCollection = await sureListService.getSuresFromNichan(board);
			this.changeSureCollection(sureCollection, board, board.displayName);
		}
	}

	private async refreshFromDb(board: BoardTable) {
		const sureCollection = await sureListService.getSuresFromDb(board);
		this.changeSureCollection(sureCollection, board, board.displayName);
	}


	public async onChangeSureModel(sure: SureModel) {
		if (this._openedBoard && this._openedBoard.path === sure.board.path) {
			await this.refreshFromDb(this._openedBoard);
		}
	}

	private changeSureCollection(sures: SureModel[], board: BoardTable | undefined, title: string) {
		this._sures = sures;
		this._openedBoard = board;
		this._list.changeData(sures);
		if (this._title !== title) {
			this._title = title;
			this.trigger("changeTitle", title);
		}
	}

	private search(text: string) {
		if (!this._sures) {
			return;
		}
		const sures = this._sures.filter(sure => sure.titleName.match(text) !== null);
		this._list.changeData(sures);
	};


 }