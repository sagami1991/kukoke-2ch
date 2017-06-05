import { db } from "database/database";
import { ImageTable } from "database/tables";

class ImageRepository {
	public getImage(id: number): Promise<ImageTable | undefined> {
		return db.images.get(id);
	}
	public getImageByUrl(url: string): Promise<ImageTable | undefined> {
		return db.images.where("url").equals(url).first();
	}

	public insertImage(image: ImageTable): Promise<number> {
		return db.images.add(image);
	}

	public deleteImage(id: number): Promise<void> {
		return db.images.delete(id);
	}
}

export const imageRepository = new ImageRepository();