type PromiseExecuter<T> = (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void
export class MyPromise<T> extends Promise<T> {
	private cancelCb: (() => void) | undefined;

	constructor(executer: PromiseExecuter<T>, cancelCb?: () => void) {
		super(executer);
		this.cancelCb = cancelCb;
	}

	public cancel() {
		if (!this.cancelCb) {
			throw new Error("キャンセルコールバックが設定されていない")
		}
		this.cancelCb();
	}
}