import type { IUser } from './users.model';
import { BaseModel, baseSchema } from './primitives/base.model';
import { Schema, Repository } from 'redis-om';
import { randomUUID } from 'crypto';
import { log } from '../index';
import redis from '../redis';

import * as z from 'zod';


export const CategoryDBSchema = baseSchema.extend({
    name: z.string()
    .min(1, { message: "Name cannot be empty" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
});

const catSchema = new Schema('Category', {
    id: { type: 'string', indexed: true },
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

export class Category extends BaseModel<Category> {
    name!: string;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    private static readonly crud = new Category();

    constructor(data?: Partial<Category>) {
        super(data, categoryRepository);
        if (data) {
            Object.assign(this, data);
        }
    }

    static getAll(): Promise<Category[]> {
        log.trace("Fetching all categories from repository");
        let categories = Category.crud.getAll();
        
        return categories;
    }

    static getById(id: string): Promise<Category | null> {
        return Category.crud.getById(id);
    }

    static getByID(id: string): Promise<Category | null> {
        return Category.getById(id);
    }

    static getByName(name: string): Promise<Category | null> {
        return Category.crud.getByName(name);
    }

    // Serializes the instance back into format suitable for Redis OM
    toEntityData(): Record<string, any> {
        let parsed = CategoryDBSchema.parse({
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        });

        return parsed;
    }

    // Constructs a Class instance from a raw Redis OM Entity object
    fromEntity(entity: any): Category | null {
        if (!entity) return null;

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


    // Instance Persistence Methods
    async save(): Promise<this> {
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

