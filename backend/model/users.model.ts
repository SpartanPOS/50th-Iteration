import { Repository, Schema } from 'redis-om'
import redis from '../redis.ts'
import { randomUUIDv7 } from 'bun';
import { verifyJWT } from '../jwt.ts';
import { log } from '../index.ts';
import type { BaseModel } from './primitives/base.model.ts';

// Permission bit flags (4-byte hex: 32-bit integer)
export const PermissionFlags = {
    READ: 0x00000001,      // bit 0
    WRITE: 0x00000002,     // bit 1
    DELETE: 0x00000004,    // bit 2
    ADMIN: 0x00000008,     // bit 3
    MANAGE_USERS: 0x00000010,  // bit 4
    MANAGE_ROLES: 0x00000020,  // bit 5
    MANAGE_ITEMS: 0x00000040,  // bit 6
    MANAGE_MENU: 0x00000080,   // bit 7
    VIEW_REPORTS: 0x00000100,  // bit 8
    EXPORT_DATA: 0x00000200,   // bit 9
} as const;

export const PermissionUtils = {
    hasPermission: (permissions: number, flag: number): boolean => {
        return (permissions & flag) === flag;
    },
    addPermission: (permissions: number, flag: number): number => {
        return permissions | flag;
    },
    removePermission: (permissions: number, flag: number): number => {
        return permissions & ~flag;
    },
    togglePermission: (permissions: number, flag: number): number => {
        return permissions ^ flag;
    },
    getAllPermissions: (): number => {
        return Object.values(PermissionFlags).reduce((acc, flag) => acc | flag, 0);
    }
};

export interface IRole {
    id: string;
    name: string;
    permissions: number;  // 32-bit hex: bit flags for permissions
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
        permissions: PermissionUtils.getAllPermissions(),  // All permissions
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: [],
        authLevel: 1,
    };
    static readonly cashier: Role = {
        id: "019ece3c-7ea0-7000-984c-733e852a2a01",
        name: "Cashier",
        permissions: PermissionFlags.READ | PermissionFlags.WRITE,  // Read and Write only
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
    permissions: { type: 'number' },  // 32-bit hex permission flags
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

class Role {
    id!: string;
    name!: string;
    permissions!: number;  // 32-bit hex permission flags
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

    static hasAuthLevel(authLevel: number): boolean {
        return this._roles.some(role => role.authLevel === authLevel);
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
    role: string; // Role name
    extraPermissions: number;  // 32-bit hex: bit flags for additional permissions
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
    extraPermissions: { type: 'number' },  // 32-bit hex permission flags
    passwordHash: { type: 'string' },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
    lastTouched: { type: 'date' },
    lastTouchedBy: { type: 'number[]' },
    entityId: { type: 'string' },
});

const userRepository = new Repository(userSchema, redis as any);
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await userRepository.createIndex();
}

export class User implements BaseModel<User> {
    id!: number;
    username!: string;
    email!: string;
    role!: Role;
    extraPermissions!: number;  // 32-bit hex permission flags
    passwordHash!: string;
    createdAt!: Date;
    updatedAt!: Date;
    lastTouched!: Date;
    lastTouchedBy!: IUser;
    entityId?: string;

    constructor(data?: Partial<IUser>) {
        if (data) {
            if (data.role === undefined) {
                throw new Error("User role must be defined");
            }
            const normalizedRole: Role = typeof data.role === 'string'
                ? (Roles.roles.find(r => r.name === data.role) ?? DefaultRoles.cashier)
                : (data.role as Role);

            Object.assign(this, data, { role: normalizedRole });
        }
    }

    static getAll(): Promise<User[]> {
        return userRepository.search().returnAll()
            .then(entities => entities
                .map(entity => User.fromEntity(entity))
                .filter((user): user is User => user !== null)
            );
    }

    static getByID(id: string): Promise<User | null> {
        return userRepository.fetch(id)
            .then(entity => User.fromEntity(entity));
    }

    static getByName(name: string): Promise<User | null> {
        return userRepository.search().where('username').equals(name).return.first()
            .then(entity => User.fromEntity(entity));
    }

    // Constructs a Class instance from a raw Redis OM Entity object
    static fromEntity(entity: any): User | null {
        // if (!entity || !entity.entityId) return null;

        let parsedUser: User | null = null;

        let parsedRole: any = null;
        if (entity.role) {
            try {
                parsedRole = typeof entity.role === 'string' ? JSON.parse(entity.role) : entity.role;
            } catch {
                parsedRole = entity.role;
            }
        }

        const user = new User({
            id: entity.id,
            username: entity.username,
            email: entity.email,
            role: parsedRole,
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
            role: this.role ? this.role.name : null,
            extraPermissions: this.extraPermissions,
            passwordHash: this.passwordHash,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastTouched: this.lastTouched,
            lastTouchedBy: this.lastTouchedBy ? JSON.stringify(this.lastTouchedBy) : null,
        };
    }



    // Instance Persistence Methods
    async save(): Promise<this> {
        const data = this.toEntityData();
        let savedEntity;

        log.debug("Saving user: " + JSON.stringify(data, null, 2));

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

    // Permission checking helper
    hasPermission(flag: number): boolean {
        // Get the user's role permissions
        log.trace(`Checking permission for user ${this.username}`);
        log.trace(`User role: ${this.role.name}, extraPermissions: ${this.extraPermissions.toString(16)}, flag to check: ${flag.toString(16)}`);
        log.trace(`User role: ${this.role.name}, extraPermissions: ${this.extraPermissions.toString(16)}, flag to check: ${flag.toString(16)}`);
        const rolePermissions = Roles.roles.find(r => r.name === this.role.name)?.permissions ?? 0;
        // Combine role permissions with extra permissions
        const combinedPermissions = rolePermissions | this.extraPermissions;
        // Check if the flag is set
        log.trace(`Checking permission for user ${this.username}: rolePermissions=${rolePermissions.toString(16)}, extraPermissions=${this.extraPermissions.toString(16)}, combinedPermissions=${combinedPermissions.toString(16)}, flag=${flag.toString(16)}`);
        return PermissionUtils.hasPermission(combinedPermissions, flag);
    }
}