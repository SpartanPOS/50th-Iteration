import type { IUser } from './users.model';
import { Schema, Repository } from 'redis-om';
import redis from '../redis';

export interface ICategory {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
}

const catSchema = new Schema('Category', {
    id: { type: 'number', indexed: true },
    name: { type: 'string' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'string' },
});

export const categoryRepository = new Repository(catSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await categoryRepository.createIndex();
}

export class Category {
    id!: number;
    name!: string;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    entityId?: string;

    constructor(data?: Partial<Category>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    // Constructs a Class instance from a raw Redis OM Entity object
    static fromEntity(entity: any): Category | null {
        if (!entity || !entity.entityId) return null;

        let parsedUser: IUser | null = null;
        if (entity.lastTouchedBy) {
            try {
                parsedUser = JSON.parse(entity.lastTouchedBy);
            } catch {
                // Fallback if it is not stringified JSON (e.g. raw ID or string)
            }
        }

        const category = new Category({
            id: entity.id,
            name: entity.name,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastTouched: entity.lastTouched,
            lastTouchedBy: parsedUser as any,
        });
        category.entityId = entity.entityId;
        return category;
    }

    // Serializes the instance back into format suitable for Redis OM
    toEntityData(): Record<string, any> {
        return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        };
    }



    // Static Finder Methods
    static async byId(id: string): Promise<Category | null> {
        const entity = await categoryRepository.fetch(id);
        return Category.fromEntity(entity);
    }

    static async byName(name: string): Promise<Category[]> {
        const entities = await categoryRepository.search().where('name').equals(name).returnAll();
        return entities
            .map(entity => Category.fromEntity(entity))
            .filter((cat): cat is Category => cat !== null);
    }

    // Instance Persistence Methods
    async save(): Promise<Category> {
        const data = this.toEntityData();
        let savedEntity;

        if (this.entityId) {
            // Update existing
            savedEntity = await categoryRepository.save(this.entityId, data);
        } else {
            // Create new
            savedEntity = await categoryRepository.save(data);
            this.entityId = savedEntity.entityId;
        }

        return this;
    }

    async delete(): Promise<void> {
        if (this.entityId) {
            await categoryRepository.remove(this.entityId);
            this.entityId = undefined;
        }
    }
}
