import { randomUUID } from "crypto";
import { z } from "zod";

export interface IModel<T = any> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    touchedBy: string;
    entityId?: string;
}

export const baseSchema = z.object({
    id: z.uuid().default(() => randomUUID()),
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    touchedBy: z.string().nullable(),
    entityId: z.string().optional(),
});

type SearchResult<TEntity> = {
    first(): Promise<TEntity | null>;
};

type SearchWhere<TEntity> = {
    equals(value: string): {
        return: SearchResult<TEntity>;
    };
};

export interface CrudRepository<TEntity = any> {
    search(): {
        returnAll(): Promise<TEntity[]>;
        where(field: string): SearchWhere<TEntity>;
    };
}

export abstract class BaseModel<T extends IModel> implements IModel {
    id!: string;
    createdAt!: Date;
    updatedAt!: Date;
    touchedBy!: string;
    entityId?: string;
    protected repository?: CrudRepository<any>;

    constructor(data?: Partial<T>, repository?: CrudRepository<any>) {
        this.repository = repository;

        if (data) {
            this.id = (data as any).id ?? randomUUID();
            Object.assign(this, data);
        }
    }

    protected getIdField(): string {
        return "id";
    }

    protected getNameField(): string {
        return "name";
    }

    async getAll(): Promise<T[]> {
        if (!this.repository) {
            throw new Error("Repository is not configured for this model");
        }

        const entities = await this.repository.search().returnAll();
        return entities
            .map((entity) => this.fromEntity(entity))
            .filter((model): model is T => model !== null);
    }

    async getById(id: string): Promise<T | null> {
        if (!this.repository) {
            throw new Error("Repository is not configured for this model");
        }

        const entity = await this.repository
            .search()
            .where(this.getIdField())
            .equals(id)
            .return.first();

        return entity ? this.fromEntity(entity) : null;
    }

    async getByName(name: string): Promise<T | null> {
        if (!this.repository) {
            throw new Error("Repository is not configured for this model");
        }

        const entity = await this.repository
            .search()
            .where(this.getNameField())
            .equals(name)
            .return.first();

        return entity ? this.fromEntity(entity) : null;
    }


    abstract fromEntity(entity: any): T | null;
    
}

