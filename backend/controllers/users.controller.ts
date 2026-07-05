import { log } from "../index";
import { Controller, Get, Post } from "../decorator";
import { signJWT, verifyJWT } from "../jwt";
import { userRepository } from "../model/users.model";
import { BaseController } from "./primitives/base.controller";
import { User } from "../model/users.model";
import { hash } from "crypto";

interface IUser {
    id: number;
    username: string;
    email: string;
    role: string;
    extraPermissions: number;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    lastTouched: Date;
    lastTouchedBy: number | null;
}

@Controller("/users")
export class UserController extends BaseController {

    constructor() {
        super({ topic: "users" });
    }

    @Get("/", 0)
    getAllUsers(_req?: Request) {
        const users = userRepository.search().return.all();
        log.info("Queried users from database:" + users);
        return Response.json("Get all users");
    }

    async __GetUserById(id: string) {
        let entities = await userRepository.fetch(id);
        if (!entities || entities.length === 0) {
            log.warn(`No user found with ID: ${id}`);
            return null;
        }
        const users: User[] = entities.map((entity: User) => User.fromEntity(entity)).filter((user: User | null): user is User => !!user);
        if (users.length === 0) {
            log.warn(`No valid User instances found for ID: ${id}`);
            return null;
        }
        return await userRepository.fetch(id);
    }

    @Get("/:id", 0)
    async getUserById(req?: Request) {
        const data = await req?.json() as { id: string };
        return Response.json("Get user by ID: " + data.id);
    }

    async __ValidateUserCredentials(username: string, password: string, auth_level: number): Promise<User | null> {
        const users = await userRepository.search().where("username").equals(username).returnAll();
        if (users.length === 0) log.warn(`No user found with username: ${username}`);
        if (!users[0]) return null;
        let user = users[0] ? User.fromEntity(users[0]) : undefined;
        if (auth_level === undefined || typeof auth_level !== "number") {
            return null;
        }
        if (!username || !password) {
            return null;
        }

        user = (await User.byName(username))[0];
        if (user === undefined) {
            log.warn(`User not found: ${username}`);
            return null;
        }
        
        const hashedPassword = hash("sha256", password).toString();
        if (user.passwordHash !== hashedPassword) {
            log.warn(`Invalid password for user: ${username}`);
            return null;
        }

        if (!user.hasPermission(auth_level)) {
            log.warn(`User ${username} does not have sufficient auth level. Required: ${auth_level}, User's: ${user.role.authLevel}`);
            return null;
        }
    }
    @Post("/auth/token", 0)
    async generateToken(req: Request) {
        try {
            const body = await req.json() as { auth_level: number, username: string, password: string };
            const user = await this.__ValidateUserCredentials(body.username, body.password, body.auth_level);
            if (!user) {
                log.warn(`Authentication failed for user: ${body.username}`);
                this.kafka([{ key: "user_login", value: JSON.stringify({ username: body.username, authLevel: body.auth_level, success: false }) }]);
                return Response.json({ error: "Invalid credentials or insufficient permissions" }, { status: 401 });
            }

            this.kafka([{ key: "user_login", value: JSON.stringify({ userId: user.id, authLevel: body.auth_level, success: true }) }]);

            const token = await signJWT({ auth_level: body.auth_level, user: user.id });
            return Response.json({ token });
        } catch (error) {
            log.error("Error generating token: " + error);
            return Response.json({ error: "Bad Request: " + error }, { status: 400 });
        }
    }

    async verify(auth: string): Promise<User | null> {
        const user = await verifyJWT(auth);
        if (!user || user.id === undefined || user.id === null) {
            return null;
        }
        const dbUser = await this.__GetUserById(String(user.id));
        return dbUser && String(dbUser.id) === String(user.id) ? dbUser : null;
    }
}