import redis from "../redis";
import type { IUser } from "./users.model";
import type { BaseModel } from "./primitives/base.model";
import { Schema, Repository } from 'redis-om';



export interface ITXItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: number;
}

export interface IActionLog {
    id: number;
    headerHash: string;
}

export interface ITX {
    id: number;
    assignedUser: IUser;
    storeId: string;
    total: number;
    items: ITXItem[];
    actionLog: IActionLog;
    authorizationCode: string;
    transactionID: string;
    transactionType: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
}

const txSchema = new Schema('TX', {
    id: { type: 'number', indexed: true },
    assignedUser: { type: 'string' },
    storeId: { type: 'string' },
    total: { type: 'number' },
    items: { type: 'string' },
    actionLog: { type: 'string' },
    authorizationCode: { type: 'string' },
    transactionID: { type: 'string' },
    transactionType: { type: 'string' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'string' },
});

const txRepository = new Repository(txSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await txRepository.createIndex();
}
    
export class tx implements ITX, BaseModel {
    id!: number;
    assignedUser!: IUser;
    storeId!: string;
    total!: number;
    items!: ITXItem[];
    actionLog!: IActionLog;
    authorizationCode!: string;
    transactionID!: string;
    transactionType!: string;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;


    constructor(
        Partial: Partial<ITX> = {}
    ) {
        Object.assign(this, Partial);
    }

    getByID(id: string): Promise<this> {
        return txRepository.fetch(id).then((entity) => {
            if (!entity) {
                throw new Error(`Transaction with ID ${id} not found`);
            }
            Object.assign(this, entity);
            return this;
    
        });
    }

    getByName(name: string): Promise<this> {
        return txRepository.search().where('name').equals(name).return.first().then((entity) => {
            if (!entity) {
                throw new Error(`Transaction with name ${name} not found`);
            }
            Object.assign(this, entity);
            return this;
        });
    }

    async toEntityData(): Promise<Record<string, any>> {
        const entityData: Record<string, any> = {
            id: this.id,
            assignedUser: JSON.stringify(this.assignedUser),
            storeId: this.storeId,
            total: this.total,
            items: JSON.stringify(this.items),
            actionLog: JSON.stringify(this.actionLog),
            authorizationCode: this.authorizationCode,
            transactionID: this.transactionID,
            transactionType: this.transactionType,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: JSON.stringify(this.lastTouchedBy),
        };
        return entityData;
    }


    async save(): Promise<this> {
        const entity = this;
        const savedEntity = await txRepository.save(entity);
        return savedEntity as this;
    }


}
