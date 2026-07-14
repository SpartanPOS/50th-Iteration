import type { IUser } from './users.model';
import { Repository, Schema } from 'redis-om';
import redis from '../redis';
import type { BaseModel } from './primitives/base.model';

export interface IStore {
    id: number;
    name: string;
    location: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
}

const storeSchema = new Schema('Store', {
    id: { type: 'number', indexed: true },
    name: { type: 'string' },
    location: { type: 'string' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'string' },
});

export const storeRepository = new Repository(storeSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await storeRepository.createIndex();
}

export class Store implements IStore, BaseModel {
    id!: number;
    name!: string;
    location!: string;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    entityId?: string;

    constructor(data?: Partial<IStore>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    // Constructs a Class instance from a raw Redis OM Entity object
    static fromEntity(entity: any): Store | null {
        if (!entity || !entity.entityId) return null;

        let parsedUser: IUser | null = null;
        if (entity.lastTouchedBy) {
            try {
                parsedUser = JSON.parse(entity.lastTouchedBy);
            } catch {
                // Fallback if it is not stringified JSON (e.g. raw ID or string)
            }
        }

        const store = new Store({
            id: entity.id,
            name: entity.name,
            location: entity.location,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastTouched: entity.lastTouched,
            lastTouchedBy: parsedUser as any,
        });
        store.entityId = entity.entityId;
        return store;
    }

    // Serializes the instance back into format suitable for Redis OM
    toEntityData(): Record<string, any> {
        return {
            id: this.id,
            name: this.name,
            location: this.location,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        };
    }

    // Static Finder Methods
    static async byId(id: string): Promise<Store | null> {
        const entity = await storeRepository.fetch(id);
        return Store.fromEntity(entity);
    }

    static async byName(name: string): Promise<Store[]> {
        const entities = await storeRepository.search().where('name').equals(name).returnAll();
        return entities
            .map(entity => Store.fromEntity(entity))
            .filter((store): store is Store => store !== null);
    }

    // Instance Persistence Methods
    async save(): Promise<this> {
        const data = this.toEntityData();
        let savedEntity;

        if (this.entityId) {
            // Update existing
            savedEntity = await storeRepository.save(this.entityId, data);
        } else {
            // Create new
            savedEntity = await storeRepository.save(data);
            this.entityId = savedEntity.entityId;
        }

        return this;
    }

    async delete(): Promise<void> {
        if (this.entityId) {
            await storeRepository.remove(this.entityId);
            this.entityId = undefined;
        }
    }
}