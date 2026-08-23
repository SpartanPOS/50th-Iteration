import { Item, itemRepository, type IItem } from "./item.model";

export { Item, itemRepository } from "./item.model";
export type { IItem } from "./item.model";

export class Items {
    async getAll(): Promise<Item[]> {
        const entities = await itemRepository.search().returnAll();
        return entities
            .map((entity) => new Item().fromEntity(entity))
            .filter((item): item is Item => item !== null);
    }

    async getById(id: string): Promise<Item | null> {
        const entity = await itemRepository
            .search()
            .where("id")
            .equals(id)
            .return.first();

        return entity ? new Item().fromEntity(entity) : null;
    }

    async getByName(name: string): Promise<Item | null> {
        const entity = await itemRepository
            .search()
            .where("name")
            .equals(name)
            .return.first();

        return entity ? new Item().fromEntity(entity) : null;
    }

    async deleteById(id: string): Promise<boolean> {
        const entity = await itemRepository
            .search()
            .where("id")
            .equals(id)
            .return.first();

        if (!entity?.entityId) {
            return false;
        }

        await itemRepository.remove(entity.entityId);
        return true;
    }
}

export const items = new Items();