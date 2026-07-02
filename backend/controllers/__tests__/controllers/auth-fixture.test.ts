import { hash } from "crypto";
import redis from "../../../redis.ts";
import { User } from "../../../model/users.model.ts";
import { UserController } from "../../users.controller.ts";

let authTokensPromise: Promise<{ adminToken: string; cashierToken: string }> | null = null;

async function seedUsers(): Promise<void> {
    await redis.flushall();

    const passwordHash = hash("sha256", "hashedpassword").toString();

    const admin = new User({
        id: 1,
        username: "admin",
        email: "admin@example.com",
        role: "admin",
        extraPermissions: 0,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: null as any,
    });

    const cashier = new User({
        id: 2,
        username: "cashier",
        email: "cashier@example.com",
        role: "cashier",
        extraPermissions: 0,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: null as any,
    });

    await admin.save();
    await cashier.save();
}

async function login(username: string, password: string, auth_level: number): Promise<string> {
    const controller = new UserController();
    const req = new Request("http://localhost/users/auth/token", {
        method: "POST",
        body: JSON.stringify({ username, password, auth_level }),
    });

    const res = await controller.generateToken(req);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to generate token for ${username}: ${res.status} ${body}`);
    }

    const body = await res.json() as { token?: string };
    if (!body.token) {
        throw new Error(`Token missing from login response for ${username}`);
    }

    return body.token;
}

export function getAuthTokens(): Promise<{ adminToken: string; cashierToken: string }> {
    if (!authTokensPromise) {
        authTokensPromise = (async () => {
            await seedUsers();
            const [adminToken, cashierToken] = await Promise.all([
                login("admin", "hashedpassword", 2),
                login("cashier", "hashedpassword", 1),
            ]);
            return { adminToken, cashierToken };
        })();
    }

    return authTokensPromise;
}
