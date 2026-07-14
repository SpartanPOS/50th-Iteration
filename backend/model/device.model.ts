import { Schema, Repository } from "redis-om";
import redis from "../redis";
import type { BaseModel } from "./primitives/base.model";

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

    async fromEntity(entity: any): Promise<Device> {
        const device = new Device();
        device.id = entity.id;
        device.name = entity.name;
        device.publicKey = entity.publicKey;
        device.identifier = entity.identifier;
        device.createdAt = entity.createdAt;
        device.updatedAt = entity.updatedAt;
        device.lastTouched = entity.lastTouched;
        device.lastTouchedBy = entity.lastTouchedBy;
        return device;
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

    async save(): Promise<Device> {
        const entityData = await this.toEntityData();
        const entity = await deviceRepository.save(entityData);
        return this.fromEntity(entity);
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

    async byId(id: string): Promise<Device | null> {
        const entity = await deviceRepository.fetch(id);
        if (!entity) return null;
        return this.fromEntity(entity);
    }

    async byName(name: string): Promise<Device | null> {
        const entities = await deviceRepository.search().where('name').equals(name).returnAll();
        if (entities.length === 0) return null;
        return this.fromEntity(entities[0]);
    }

}