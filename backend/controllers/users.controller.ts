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
        const users: User[] = entities.map((entity: User) => User.fromEntity(entity)).filter((user): user is User => user !== null);
        if (users.length === 0) {
            log.warn(`No valid User instances found for ID: ${id}`);
            return null;
        }
        return await userRepository.fetch(id);
    }

    @Get("/:id", 0)
    async getUserById(req?: Request) {
        const data = await req?.json().id;
        return Response.json("Get user by ID: " + data.id);
    }

    @Post("/auth/token", 0)
    async generateToken(req: Request) {
        try {
            const body = await req.json() as { auth_level: number, username: string, password: string };
            if (body.auth_level === undefined || typeof body.auth_level !== "number") {
                return Response.json({ error: "Invalid auth_level. Must be a number." }, { status: 400 });
            }
            if (!body.username || !body.password) {
                return Response.json({ error: "Username and password are required." }, { status: 400 });
            }
            let user: User | undefined = (await User.byName(body.username))[0];
            if (user === undefined) {
                log.warn(`User not found: ${body.username}`);
                return Response.json({ error: "Invalid username or password." }, { status: 401 });
            }
            
            const hashedPassword = hash("sha256", body.password).toString();
            if (user.passwordHash !== hashedPassword) {
                log.warn(`Invalid password for user: ${body.username}`);
                return Response.json({ error: "Invalid username or password." }, { status: 401 });
            }

            if (!user.hasPermission(body.auth_level)) {
                log.warn(`User ${body.username} does not have sufficient auth level. Required: ${body.auth_level}, User's: ${user.role.authLevel}`);
                return Response.json({ error: "Insufficient authorization level." }, { status: 403 });
            }

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