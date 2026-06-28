import { Controller, Post } from "../decorator";
import { log } from "../index";
import { Get } from "../decorator";
import { User } from "../model/users.model";
import { Item } from "../model/items.model"

import { producer } from "../events/kafka";

import { Category } from "../model/category.model";

import type { IItem } from "../model/items.model"


interface IConfig {
    items?: IItem[];
    categories?: Category[];
    menu?: IMenu[];
}

@Controller("/admin")
export class AdminController {

    @Post("/items/add", 0)
    async addItems(req: Request): Promise<Response> {
        const json: { items?: unknown, categories?: unknown, menu?: unknown, sku: string } = await req.json();
        const items = json.items;
        const categories = json.categories;
        const menu = json.menu;
        const sku = json.sku ?? "MISC-" + Math.floor(Math.random() * 1000)



        const auth = req.getHeader("Authorization");
        if (!auth) {
            
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        const user = await (User as any).verify(auth);
        if (!user) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        try {
            await producer.send({
                topic: "config",
                messages: [
                    { key: "item.add", value: sku }
                ]
            })
            const entities = new IItem();
            
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