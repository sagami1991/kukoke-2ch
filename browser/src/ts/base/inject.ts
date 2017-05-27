const registerd: { [key: string]: any } = {};

/** @deprecated */
export function injectable(injectClass: Function, className?: string) {
	const instance = new (<any>injectClass)();
	registerd[injectClass.name] = instance;
}

/** @deprecated */
export function inject(injectClass: Function) {
	return (target: any, property: string) => {
		target[property] = registerd[injectClass.name];
	};
}