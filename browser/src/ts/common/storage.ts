import { PanelType } from 'panel/basePanel';
import { _ } from "./libs";
export type StorageType = PanelType;

export class MyStorage {
	private static getKey(storageType: StorageType, keyName: string) {
		return `kukoke_${storageType}-${keyName}`;
	}

	public static save(storageType: StorageType, key: string, data: any) {
		const storageKey = this.getKey(storageType, key);
		localStorage.setItem(storageKey, JSON.stringify(data));
	}

	public static get<T>(storageType: StorageType, key: string): T | null {
		const storageKey = this.getKey(storageType, key);
		const item = localStorage.getItem(storageKey);
		if (item) {
			return <T>JSON.parse(item);
		} else {
			return null;
		}
	}

	public static upsert<T>(storageType: StorageType, key: string, data: T, findCb: (obj: T) => boolean) {
		let array = this.get<T[]>(storageType, key);
		if (array && _.isArray(array)) {
			const index = array.findIndex(obj => findCb(obj));
			if (index > -1) {
				array[index] = data;
				this.save(storageType, key, array);
				return;
			}
		}
		this.save(storageType, key, [data]);
	}
}