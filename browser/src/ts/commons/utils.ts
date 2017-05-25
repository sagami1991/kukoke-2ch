
export function alertMessage(type: "error" | "warn" | "info" | "success", msg: string) {
	alert(msg);
}

export function jsonParse<T>(json: string) {
	const obj = <T> JSON.parse(json);
	return obj;
}

export function jsonString<T>(obj: T) {
	return JSON.stringify(obj);
}