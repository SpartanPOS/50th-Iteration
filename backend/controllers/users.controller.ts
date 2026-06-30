import { log } from "../index";
import { Controller, Get, Post } from "../decorator";
import { signJWT, verifyJWT } from "../jwt";
import { userRepository } from "../model/users.model";
import { BaseController } from "./primitives/base.controller";

@Controller("/users")
export class UserController extends BaseController {
    @Get("/", 0)
    getAllUsers(_req?: Request) {
        const users = userRepository.search().return.all();
        log.info("Queried users from database:" + users);
        return Response.json("Get all users");
    }

    async __GetUserById(id: string) {
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
            const body = await req.json() as { auth_level: number };
            if (body.auth_level === undefined || typeof body.auth_level !== "number") {
                return Response.json({ error: "Invalid auth_level. Must be a number." }, { status: 400 });
            }
            const token = await signJWT({ auth_level: body.auth_level });
            return Response.json({ token });
        } catch (error) {
            log.error("Error generating token: " + error);
            return Response.json({ error: "Bad Request: " + error }, { status: 400 });
        }
    }

    async verify(auth: string): Promise<boolean | null> {
        const user = await verifyJWT(auth);
        if (!user || user.id === undefined || user.id === null) {
            return null;
        }
        const dbUser = await this.__GetUserById(String(user.id));
        return dbUser && String(dbUser.id) === String(user.id) ? true : null;
    }
}