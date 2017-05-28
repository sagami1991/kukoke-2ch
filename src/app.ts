import { readJsonFile, toJson, wrtiteJsonFile, mkdir } from './utils';
import {app, BrowserWindow, Menu, MenuItem} from "electron";
import * as Electron from "electron";
import {getMenuItems} from "./appmenu";
class MainApp {

	private readonly stateFilePath: string;
	private mainWindow: Electron.BrowserWindow;
	constructor() {
		this.stateFilePath = `${app.getPath("userData")}/window-state.json`;
		this.init();

	}
	public init() {
		app.once("window-all-closed", () => this.onAllClose());
		app.once("ready", () => this.initMainWindow());
	}

	private onAllClose() {
		if (process.platform !== "darwin") {
			app.quit();
		}
	}

	private async initMainWindow() {
		await mkdir("dat");
		await mkdir("thumb");
		await mkdir("image");
		const restoreData = await this.restoreWindowState();
		this.mainWindow = new BrowserWindow(restoreData.browserOptions);
		this.setAppSetting(this.mainWindow);
		if (restoreData.maximized) {
			this.mainWindow.maximize();
		}
		this.mainWindow.loadURL(`${__dirname}/browser/index.html`);
		this.mainWindow.once("close", async (event) => {
			event.preventDefault();
			await this.saveWindowState();
			this.mainWindow.close();
		});
		this.initMenuBar();
		console.log("launch window");
	}

	private setAppSetting(browser: Electron.BrowserWindow) {
		browser.webContents.setUserAgent("Mozilla/3.0 (compatible; JaneStyle/3.83)");
		browser.webContents.session.webRequest.onBeforeSendHeaders({
			urls: ['*']
		}, (details, callback) => {
			const refrer = details.requestHeaders['Kukoke-Referer'];
			if (refrer) {
				delete details.requestHeaders['Kukoke-Referer']; 
				details.requestHeaders['Referer'] = refrer;
			}
			callback({cancel: false, requestHeaders: details.requestHeaders});
		});
	}

	private async restoreWindowState() {
		let restoreData = await readJsonFile<MyAppState>(this.stateFilePath);
		if (restoreData) {
			restoreData.browserOptions = this.validateRestoredData(restoreData.browserOptions);
		}
		return Object.assign(this.getDefaultWindowState(), restoreData);
	}

	private validateRestoredData(option: Electron.BrowserWindowConstructorOptions) {
		const displays = Electron.screen.getAllDisplays();
		if (displays.length === 1) {
			const bounds = displays[0].bounds;
			if (option.x && option.x < bounds.x ) {
				option.x = bounds.x;
			}
			if (option.y && option.y < bounds.y ) {
				option.y = bounds.y;
			}
		}
		return option;
	}

	private async saveWindowState() {
		const browserOption = this.mainWindow.getBounds();
		const appState: MyAppState = {
			browserOptions: browserOption,
			maximized: this.mainWindow.isMaximized()
		};
		await wrtiteJsonFile<MyAppState>(this.stateFilePath, appState);
		
	}

	private getDefaultWindowState(): MyAppState {
		return {
			browserOptions: {
				width: 800,
				height: 600,
				icon: `${__dirname}/resources/app_icon.ico`,
			}, 
			maximized: false
		};
	}

	private initMenuBar() {
		const menubar = new Menu();
		getMenuItems().forEach(menuItem => menubar.append(new MenuItem(menuItem)));
		Menu.setApplicationMenu(menubar);
	}
}

new MainApp();
