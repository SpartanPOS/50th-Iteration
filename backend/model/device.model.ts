import { Schema, Repository } from "redis-om";
import redis from "../redis";
import type { BaseModel } from "./primitives/base.model";
import type { IDeviceConfig } from "./primitives/deviceconfig.model";
import { User } from "./users.model";
import { Menu } from "./menu.model";

interface IDevice {
    id: string;
    name: string;
    publicKey: string;
    identifier: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: string;
}

const deviceSchema = new Schema('Device', {
    id: { type: 'string', indexed: true },
    name: { type: 'string' },
    publicKey: { type: 'string' },
    identifier: { type: 'string' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'string' },
});

export const deviceRepository = new Repository(deviceSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await deviceRepository.createIndex();
}

export class Device implements IDevice, BaseModel {
    id!: string
    name!: string;
    publicKey!: string;
    identifier!: string;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: string;

    constructor(data?: Partial<IDevice>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    async fromEntity(entity: any): Promise<this> {
        const device = new Device();
        device.id = entity.id;
        device.name = entity.name;
        device.publicKey = entity.publicKey;
        device.identifier = entity.identifier;
        device.createdAt = entity.createdAt;
        device.updatedAt = entity.updatedAt;
        device.lastTouched = entity.lastTouched;
        device.lastTouchedBy = entity.lastTouchedBy;
        Object.assign(this, device);
        return this;
    }

    async toEntityData(): Promise<Record<string, any>> {
        return {
            id: this.id,
            name: this.name,
            publicKey: this.publicKey,
            identifier: this.identifier,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy,
        };
    }

    async save(): Promise<this> {
        const entityData = await this.toEntityData();
        const entity = await deviceRepository.save(entityData);
        return this;
    }

    async getAll(): Promise<Device[]> {
        const entities = await deviceRepository.search().returnAll();
        const devices: Device[] = [];
        for (const entity of entities) {
            const device = await this.fromEntity(entity);
            devices.push(device);
        }
        return devices;
    }

    async getByID(id: string): Promise<this | null> {
        const entity = await deviceRepository.fetch(id);
        if (!entity) return null;
        return this.fromEntity(entity);
    }

    async getByName(name: string): Promise<this | null> {
        const entities = await deviceRepository.search().where('name').equals(name).returnAll();
        if (entities.length === 0) return null;
        return this.fromEntity(entities[0]);
    }

    

}