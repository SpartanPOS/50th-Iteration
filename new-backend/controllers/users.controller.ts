import { log } from "../index";
import { Controller, Get, Post } from "../decorator";
import { signJWT } from "../jwt";
import { userRepository } from "../model/users.model";

@Controller("/users")
export class UserController {
    @Get("/", 0)
    getAllUsers(_req?: Request) {
        const users = userRepository.search().return.all();
        log.info("Queried users from database:" + users);
        return Response.json("Get all users");
    }

    @Get("/:id", 0)
    async getUserById(req: Request) {
        const data = await req.json() as { id: string };
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
}