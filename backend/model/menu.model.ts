import type { Item } from "./items.model";
import type { User } from "./users.model";
import type { Category } from "./category.model";
import { BaseModel } from "./primitives/base.model";
import { Schema, Repository } from "redis-om";
import redis from "../redis";
import * as z from "zod";

interface MenuActiveDate {
    startDate: Date;
    endDate: Date;
}

export interface IMenu {
    id: number;
    name: string;
    items: Item[];
    categories: Category[];
    datesActive: MenuActiveDate[];
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    touchedBy: string | null;
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
    touchedBy: { type: 'string' },
});

const zMenuSchema = z.object({
    id: z.number(),
    name: z.string()
    .min(1, { message: "Menu name cannot be empty" })
    .max(20, { message: "Menu name cannot exceed 20 characters" }),
    items: z.array(z.string()),
    
    categories: z.array(z.string()),
    datesActive: z.array(z.object({
        startDate: z.string(),
        endDate: z.string(),
    })),
    createdAt: z.string(),
    updatedAt: z.string(),
    lastTouched: z.string(),
    touchedBy: z.string(),
});

export class Menu extends BaseModel<Menu> {
    name!: string;
    items!: Item[];
    categories!: Category[];
    datesActive!: MenuActiveDate[];

    constructor(data?: Partial<Menu>) {
        super(data, menuRepository);
        if (data) {
            Object.assign(this, data);
        }
    }

    fromEntity(entity: any): Menu | null {
        if (!entity || !entity.entityId) return null;

        let parsedUser: User | null = null;
        if (entity.touchedBy) {
            try {
                parsedUser = JSON.parse(entity.touchedBy);
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
        };
    }

    async save(): Promise<this> {
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
