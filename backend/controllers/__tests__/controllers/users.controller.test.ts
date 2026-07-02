import { mock, test, expect, describe, beforeEach } from "bun:test";
import { hash } from "crypto";

export let cashierToken: string | null = null;
export let adminToken: string | null = null;

// Mock database
const mockDatabase = [
    { 
        entityId: "user:1",
        id: 1, 
        username: "admin", 
        email: "admin@example.com",
        passwordHash: hash("sha256", "hashedpassword"), 
        role: "admin", 
        extraPermissions: 0, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        lastTouched: new Date(), 
        lastTouchedBy: null 
    },
    { 
        entityId: "user:2",
        id: 2, 
        username: "cashier", 
        email: "cashier@example.com",
        passwordHash: hash("sha256", "hashedpassword"), 
        role: "cashier", 
        extraPermissions: 0, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        lastTouched: new Date(), 
        lastTouchedBy: null 
    }
];

mock.module("../../index", () => {
    return {
        log: {
            info: mock(),
            error: mock(),
            warn: mock(),
            trace: mock(),
            withMetadata: () => ({ info: mock() })
        }
    };
});

mock.module("../../model/users.model", () => {
    const createUserWithMethods = (user: any) => ({
        ...user,
        hasPermission: (flag: number) => {
            // Mock implementation: admin has all permissions, cashier has limited
            if (user.role === "admin") return true;
            if (user.role === "cashier") return flag <= 0x00000002; // READ | WRITE
            return false;
        }
    });

    return {
        userRepository: {
            fetch: mock((id: string) => {
                const user = mockDatabase.find(u => u.entityId === id);
                return user ? createUserWithMethods(user) : null;
            }),
            search: () => ({
                where: (field: string) => ({
                    equals: (value: string) => ({
                        returnAll: mock(() => {
                            if (field === 'username') {
                                return mockDatabase.filter(u => u.username === value).map(createUserWithMethods);
                            }
                            return [];
                        })
                    })
                })
            }),
            save: mock((idOrData: any, data?: any) => {
                const newUser = data || idOrData;
                const entityId = idOrData === newUser ? `user:${Date.now()}` : idOrData;
                return createUserWithMethods({ ...newUser, entityId });
            }),
            remove: mock(() => Promise.resolve())
        },
        User: {
            fromEntity: (entity: any) => createUserWithMethods(entity),
            byId: mock((id: string) => {
                const user = mockDatabase.find(u => u.entityId === id);
                return user ? createUserWithMethods(user) : null;
            }),
            byName: mock((name: string) => mockDatabase.filter(u => u.username === name).map(createUserWithMethods))
        }
    };
});

import { UserController } from "../../users.controller";

describe("UserController", () => {
    let controller: UserController;

    beforeEach(() => {
        controller = new UserController();
    });

    test("login to admin", async () => {
        const req = new Request("http://localhost/users/auth/token", {
            method: "POST",
            body: JSON.stringify({ username: "admin", password: "hashedpassword", auth_level: 2 })
        });
        const res = await controller.generateToken?.(req) || new Response(JSON.stringify({ error: "Not implemented" }), { status: 404 });
        adminToken = await res.json().then((data: any) => data.token);
        expect(res.status).toBe(200);
        if (res.status === 200) {
            adminToken = await res.json().then((data: any) => data.token);
        }
    });

    test("login to cashier", async () => {
        const req = new Request("http://localhost/users/auth/token", {
            method: "POST",
            body: JSON.stringify({ username: "cashier", password: "hashedpassword", auth_level: 1 })
        });
        const res = await controller.generateToken?.(req) || new Response(JSON.stringify({ error: "Not implemented" }), { status: 404 });
        expect(res.status).toBe(200);
        if (res.status === 200) {
            cashierToken = await res.json().then((data: any) => data.token);
        }
    });


    test("generateToken should fail without auth_level", async () => {
        const req = new Request("http://localhost/users/auth/token", {
            method: "POST",
            body: JSON.stringify({ foo: "bar" })
        });
        const res = await controller.generateToken(req);
        expect(res.status).toBe(400);
        const json = await res.json() as { error: string };
        expect(json.error).toContain("Invalid auth_level");
    });

    test("generateToken should fail with invalid password", async () => {
        const req = new Request("http://localhost/users/auth/token", {
            method: "POST",
            body: JSON.stringify({ username: "admin", password: "wrongpassword", auth_level: 1 })
        });
        const res = await controller.generateToken(req);
        expect(res.status).toBe(401);
        const json = await res.json() as { error: string };
        expect(json.error).toContain("Invalid username or password");
    });

    test("generateToken should fail with insufficient auth level", async () => {
        const req = new Request("http://localhost/users/auth/token", {
            method: "POST",
            body: JSON.stringify({ username: "cashier", password: "hashedpassword", auth_level: 4 })
        });
        const res = await controller.generateToken(req);
        expect(res.status).toBe(403);
        const json = await res.json() as { error: string };
        expect(json.error).toContain("Insufficient authorization level");
    });
});
