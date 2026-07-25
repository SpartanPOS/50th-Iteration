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

    constructor(data?: Partial<Category>) {
        super(data, categoryRepository);
        if (data) {
            Object.assign(this, data);
        }
    }

    // Serializes the instance back into format suitable for Redis OM
    toEntityData(): Record<string, any> {
        let parsed = CategoryDBSchema.parse({
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
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
            name: entity.name,
        });
        category.entityId = entity.entityId;
        return category;
    }


    // Instance Persistence Methods
    async save(): Promise<this> {
        const data = this.toEntityData();

        let savedEntity = await categoryRepository.save(data);

        return this;
    }

    async delete(): Promise<void> {
        if (this.entityId) {
            await categoryRepository.remove(this.entityId);
            this.entityId = undefined;
        }
    }
}

