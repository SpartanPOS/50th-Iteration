import { mock, test, expect, describe, beforeEach } from "bun:test";

mock.module("../../index", () => {
    return {
        log: {
            info: mock(),
            error: mock(),
            withMetadata: () => ({ info: mock() })
        }
    };
});

const mockAll = mock(() => [{ id: "1", name: "User 1" }]);

mock.module("../../model/users.model", () => {
    return {
        userRepository: {
            search: () => ({
                return: {
                    all: mockAll
                }
            })
        }
    };
});

import { UserController } from "../../controllers/users.controller";

describe("UserController", () => {
    let controller: UserController;

    beforeEach(() => {
        controller = new UserController();
        mockAll.mockClear();
    });

    test("getAllUsers should query and return expected response", async () => {
        const req = new Request("http://localhost/users");
        const res = await controller.getAllUsers(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toBe("Get all users");
        expect(mockAll).toHaveBeenCalled();
    });

    test("getUserById should parse body and return id", async () => {
        // We use POST to construct the request because GET requests cannot have a body.
        const req = new Request("http://localhost/users/1", {
            method: "POST",
            body: JSON.stringify({ id: "123" })
        });
        const res = await controller.getUserById(req);
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json).toBe("Get user by ID: 123");
    });

    test("generateToken should generate JWT token with valid auth_level", async () => {
        const req = new Request("http://localhost/users/auth/token", {
            method: "POST",
            body: JSON.stringify({ auth_level: 2 })
        });
        const res = await controller.generateToken(req);
        expect(res.status).toBe(200);
        const json = await res.json() as { token: string };
        expect(typeof json.token).toBe("string");
        expect(json.token.split('.').length).toBe(3);
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
});
