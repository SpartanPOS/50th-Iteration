import { Repository, Schema } from 'redis-om'
import redis from '../redis.ts'
import { randomUUIDv7 } from 'bun';
import { verifyJWT } from '../jwt.ts';

interface permissions {
    id: number;
    name: string;
}

export interface IRole {
    id: string;
    name: string;
    permissions: permissions[];
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: number[];
    authLevel: number;
}

export class DefaultRoles {
    static readonly admin: Role = {
        id: "019ece3c-368f-7000-ab47-19ef38690a74",
        name: "Admin",
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: [],
        authLevel: 1,
    };
    static readonly cashier: Role = {
        id: "019ece3c-7ea0-7000-984c-733e852a2a01",
        name: "Cashier",
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: [],
        authLevel: 0,
    };

    static getDefaultRoles(): Role[] {
        return [DefaultRoles.cashier, DefaultRoles.admin];
    }
}

export const roleSchema = new Schema('Role', {
    id: { type: 'string', indexed: true },
    name: { type: 'string' },
    permissions: { type: 'string[]' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'number[]' },
    authLevel: { type: 'number' },
});

export const roleRepository = new Repository(roleSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await roleRepository.createIndex();
}

class Role implements IRole {
    id!: string;
    name!: string;
    permissions!: permissions[];
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: number[];
    authLevel!: number;
    entityId?: string;

    constructor(
        data?: Partial<IRole>
    ) {
        if (data) {
            Object.assign(this, data);
        }
    }

    static fromEntity(entity: any): Role {
        return new Role({
            id: entity.id,
            name: entity.name,
            permissions: entity.permissions,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastTouched: entity.lastTouched,
            lastTouchedBy: entity.lastTouchedBy,
            authLevel: entity.authLevel,
        });
    }
}

export class Roles {
    private static _roles: readonly Role[] = [
        ...DefaultRoles.getDefaultRoles()
    ];

    static get roles(): readonly Role[] {
        return this._roles;
    }

    static async loadRoles() {
        const dbRoles = (await roleRepository.search().returnAll()).map((e: any) => Role.fromEntity(e));
        dbRoles.sort((a, b) => (a.authLevel ?? 0) - (b.authLevel ?? 0));
        this._roles = Object.freeze(dbRoles);
    }
}



export interface IUser {
    id: number;
    username: string;
    email: string;
    role: DefaultRoles;
    extraPermissions: permissions[];
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: IUser;
    entityId?: string;
}

export const userSchema = new Schema('User', {
    id: { type: 'number', indexed: true },
    username: { type: 'string' },
    email: { type: 'string' },
    role: { type: 'string' },
    extraPermissions: { type: 'string[]' },
    passwordHash: { type: 'string' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'number[]' },
});

/* use the client to create a Repository just for Persons */
export const userRepository = new Repository(userSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await userRepository.createIndex();
}

export class User implements IUser {
    id!: number;
    username!: string;
    email!: string;
    role!: "admin" | "cashier";
    extraPermissions!: permissions[];
    passwordHash!: string;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    entityId?: string;

    constructor(data?: Partial<IUser>) {
        if (data) {
            Object.assign(this, data);
        }
    }

    // Constructs a Class instance from a raw Redis OM Entity object
    static fromEntity(entity: any): User | null {
        if (!entity || !entity.entityId) return null;

        let parsedUser: User | null = null;
        if (entity.lastTouchedBy) {
            try {
                parsedUser = JSON.parse(entity.lastTouchedBy);
            } catch {
                // Fallback if it is not stringified JSON (e.g. raw ID or string)
            }
        }

        const user = new User({
            id: entity.id,
            username: entity.username,
            email: entity.email,
            role: entity.role,
            extraPermissions: entity.extraPermissions,
            passwordHash: entity.passwordHash,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            lastTouched: entity.lastTouched,
            lastTouchedBy: parsedUser as any,
        });
        user.entityId = entity.entityId;
        return user;
    }

    // Serializes the instance back into format suitable for Redis OM
    toEntityData(): Record<string, any> {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            role: this.role,
            extraPermissions: this.extraPermissions,
            passwordHash: this.passwordHash,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        };
    }

    // Static Finder Methods
    static async byId(id: string): Promise<User | null> {
        const entity = await userRepository.fetch(id);
        return User.fromEntity(entity);
    }

    static async byName(name: string): Promise<User[]> {
        const entities = await userRepository.search().where('name').equals(name).returnAll();
        return entities
            .map(entity => User.fromEntity(entity))
            .filter((user): user is User => user !== null);
    }

    static async getAll(): Promise<User[]> {
        const entities = await userRepository.search().returnAll();
        return entities
            .map(entity => User.fromEntity(entity))
            .filter((user): user is User => user !== null);
    }

    // Instance Persistence Methods
    async save(): Promise<User> {
        const data = this.toEntityData();
        let savedEntity;

        if (this.entityId) {
            // Update existing
            savedEntity = await userRepository.save(this.entityId, data);
        } else {
            // Create new
            savedEntity = await userRepository.save(data);
            this.entityId = savedEntity.entityId;
        }

        return this;
    }


    async delete(): Promise<void> {
        if (this.entityId) {
            await userRepository.remove(this.entityId);
            this.entityId = undefined;
        }
    }
}