import type { IItem } from "./items.model";
import type { IUser } from "./users.model";
import type { Category } from "./category.model";
import { Schema, Repository } from "redis-om";
import redis from "../redis";

interface MenuActiveDate {
    startDate: Date;
    endDate: Date;
}

export interface IMenu {
    id: number;
    name: string;
    items: IItem[];
    categories: Category[];
    datesActive: MenuActiveDate[];
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
}

const menuSchema = new Schema('Menu', {
    id: { type: 'number', indexed: true },
    name: { type: 'string' },
    items: { type: 'string[]' },
    categories: { type: 'string[]' },
    datesActive: { type: 'string[]' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'string' },
});

export class Menu implements IMenu {
    id!: number;
    name!: string;
    items!: IItem[];
    categories!: Category[];
    datesActive!: MenuActiveDate[];
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    entityId?: string;

    constructor(data?: Partial<IMenu>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    static async getAll(): Promise<Menu[]> {
        const entities = await menuRepository.search().returnAll();
        return entities
            .map(entity => Menu.fromEntity(entity))
            .filter((menu): menu is Menu => menu !== null);
    }

    static async byId(id: string): Promise<Menu | null> {
        const entity = await menuRepository.fetch(id);
        return Menu.fromEntity(entity);
    }



    static fromEntity(entity: any): Menu | null {
        if (!entity || !entity.entityId) return null;

        let parsedUser: IUser | null = null;
        if (entity.lastTouchedBy) {
            try {
                parsedUser = JSON.parse(entity.lastTouchedBy);
            } catch {
                // Fallback if it is not stringified JSON (e.g. raw ID or string)
            }
        }

        const menu = new Menu({
            id: entity.id,
            name: entity.name,
            items: entity.items,
            categories: entity.categories,
            datesActive: entity.datesActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastTouched: entity.lastTouched,
            lastTouchedBy: parsedUser as any,
        });
        menu.entityId = entity.entityId;
        return menu;
    }

    toEntityData(): Record<string, any> {
        return {
            id: this.id,
            name: this.name,
            items: this.items,
            categories: this.categories,
            datesActive: this.datesActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        };
    }

    async save(): Promise<Menu> {
        const data = this.toEntityData();
        let savedEntity;

        if (this.entityId) {
            // Update existing
            savedEntity = await menuRepository.save(this.entityId, data);
        } else {
            // Create new
            savedEntity = await menuRepository.save(data);
            this.entityId = savedEntity.entityId;
        }

        return this;
    }

    async delete(): Promise<void> {
        if (this.entityId) {
            await menuRepository.remove(this.entityId);
            this.entityId = undefined;
        }
    }
}

export const menuRepository = new Repository(menuSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await menuRepository.createIndex();
}
