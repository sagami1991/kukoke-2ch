// type PromiseExecuter<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void
export class CancelablePromise<T> extends Promise<T> {
	private cancelCallback: (() => void) | undefined;

	public cancel() {
		if (!this.cancelCallback) {
			throw new Error("キャンセルコールバックが設定されていない")
		}
		this.cancelCallback();
	}

	public onCancel(cancelCallback: () => void) {
		this.cancelCallback = cancelCallback;
		return this;
	}
}