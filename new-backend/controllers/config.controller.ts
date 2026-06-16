import { Controller, Post } from "../decorator";
import { log } from "../index";
import { Get } from "../decorator";

@Controller("/admin")
export class AdminController {



    @Post("/items/add", 0)
    async addItems(req: Request): Promise<Response> {
        const { items, categories, menu, }: IConfig = await req.json();
        try {
            const entities = await User.getAll();
            return Response.json({ success: true, data: entities }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/menu/add", 0)
    async addMenu(req: Request): Promise<Response> {
        const { items, categories, menu, }: IConfig = await req.json();
        try {
            const entities = await User.getAll();
            return Response.json({ success: true, data: entities }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/category/add", 0)
    async addCategory(req: Request): Promise<Response> {
        const { items, categories, menu, }: IConfig = await req.json();
        try {
            const entities = await User.getAll();
            return Response.json({ success: true, data: entities }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/user/add", 0)
    async addUser(req: Request): Promise<Response> {
        const { items, categories, menu, }: IConfig = await req.json();
        try {
            const entities = await User.getAll();
            return Response.json({ success: true, data: entities }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }
}