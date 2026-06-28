import { type IUser } from "./users.model";
import type { Category } from "./category.model";
import { Schema, Repository } from 'redis-om';
import redis from '../redis';

export interface IItem {
    id: number;
    name: string;
    category: Category;
    description: string;
    price: number;
    sku: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
}

const itemSchema = new Schema('Item', {
    id: { type: 'number', indexed: true },
    name: { type: 'string' },
    category: { type: 'string' },
    description: { type: 'string' },
    price: { type: 'number' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'string' },
});

export const itemRepository = new Repository(itemSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await itemRepository.createIndex();
}

export class Item implements IItem {
    id!: number;
    name!: string;
    category!: Category;
    sku!: string;
    description!: string;
    price!: number;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    entityId?: string;

    constructor(data?: Partial<IItem>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    // Constructs a Class instance from a raw Redis OM Entity object
    static fromEntity(entity: any): Item | null {
        if (!entity || !entity.entityId) return null;

        let parsedUser: IUser | null = null;
        if (entity.lastTouchedBy) {
            try {
                parsedUser = JSON.parse(entity.lastTouchedBy);
            } catch {
                // Fallback if it is not stringified JSON (e.g. raw ID or string)
            }
        }

        const item = new Item({
            id: entity.id,
            name: entity.name,
            category: entity.category,
            sku: entity.sku,
            description: entity.description,
            price: entity.price,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastTouched: entity.lastTouched,
            lastTouchedBy: parsedUser as any,
        });
        item.entityId = entity.entityId;
        return item;
    }

    // Serializes the instance back into format suitable for Redis OM
    toEntityData(): Record<string, any> {
        return {
            id: this.id,
            name: this.name,
            category: this.category,
            description: this.description,
            price: this.price,
            sku: this.sku,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        };
    }

    static async getAll(): Promise<Array<Item | null>> {
        const entities = await itemRepository.search().returnAll();
        return entities
            .map(entity => Item.fromEntity(entity))
            .filter((item): item is Item => item !== null);
    }

    // Static Finder Methods
    static async byId(id: string): Promise<Item | null> {
        const entity = await itemRepository.fetch(id);
        return Item.fromEntity(entity);
    }

    static async byName(name: string): Promise<Item[]> {
        const entities = await itemRepository.search().where('name').equals(name).returnAll();
        return entities
            .map(entity => Item.fromEntity(entity))
            .filter((item): item is Item => item !== null);
    }

    // Instance Persistence Methods
    async save(): Promise<Item> {
        const data = this.toEntityData();
        let savedEntity;

        if (this.entityId) {
            // Update existing
            savedEntity = await itemRepository.save(this.entityId, data);
        } else {
            // Create new
            savedEntity = await itemRepository.save(data);
            this.entityId = savedEntity.entityId;
        }

        return this;
    }

    async delete(): Promise<void> {
        if (this.entityId) {
            await itemRepository.remove(this.entityId);
            this.entityId = undefined;
        }
    }
}