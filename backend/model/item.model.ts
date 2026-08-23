import { Category } from "./category.model";
import { Schema, Repository } from "redis-om";
import redis from "../redis";
import { BaseModel } from "./primitives/base.model";
import { baseSchema } from "./primitives/base.model";
import * as z from "zod";

const ItemDBSchema = baseSchema.extend({
    category: z.union([z.string(), z.instanceof(Category)]),
    name: z.string()
        .min(1, { message: "Name cannot be empty" })
        .max(100, { message: "Name cannot exceed 100 characters" }),
    price: z.number().min(0, { message: "Price must be a non-negative number" }),
    description: z.string().optional(),
    sku: z.string().default("MISC-" + Math.floor(Math.random() * 10000).toString()),
});

export type IItem = z.infer<typeof ItemDBSchema>;

const itemSchema = new Schema("Item", {
    id: { type: "string", indexed: true },
    name: { type: "string" },
    category: { type: "string" },
    description: { type: "string" },
    price: { type: "number" },
    sku: { type: "string" },
    createdAt: { type: "date" },
    updatedAt: { type: "date" },
    lastTouched: { type: "date" },
    touchedBy: { type: "string" },
    entityId: { type: "string" }
});

export const itemRepository = new Repository(itemSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await itemRepository.createIndex();
}

export class Item extends BaseModel<Item> {
    name!: string;
    category!: Category;
    sku!: string;
    description!: string;
    price!: number;

    constructor(data?: Partial<Item>) {
        super(data, itemRepository);
        if (data) {
            Object.assign(this, data);
        }
    }

    fromEntity(entity: any): Item | null {
        if (!entity) return null;

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
            touchedBy: entity.touchedBy,
            entityId: entity.entityId
        });
        return item;
    }

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
        };
    }

    async save(): Promise<this> {
        const data = this.toEntityData();

        if (this.entityId) {
            await itemRepository.save(this.entityId, data);
        } else {
            const savedEntity = await itemRepository.save(data);
            this.entityId = savedEntity.entityId;
        }

        return this;
    }

    async delete(): Promise<void> {
        let entityId = this.entityId;

        if (!entityId) {
            const entity = await itemRepository
                .search()
                .where("id")
                .equals(this.id)
                .return.first();
            entityId = entity?.entityId;
        }

        if (entityId) {
            await itemRepository.remove(entityId);
            this.entityId = undefined;
        }
    }
}