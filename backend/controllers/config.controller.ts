import { Controller, Post } from "../decorator";
import { hash } from "crypto";
import { log, log } from "../index";
import { Get } from "../decorator";
import { UserController } from "./users.controller";
import { Item } from "../model/items.model";
import { BaseController } from "./primitives/base.controller"
import { User } from "../model/users.model";

import type { IItem } from "../model/items.model";
import type { ICategory } from "../model/category.model";
import type { IMenu } from "../model/menu.model";

import { Category } from "../model/category.model";

import type { IMenu } from "../model/menu.model"


@Controller("/admin")
export class AdminController extends BaseController {

    constructor() {
        super({ topic: "config" });
    }

    @Post("/items/add", 2)
    async addItems(req: Request): Promise<Response> {
        const json: { items?: unknown, categories?: unknown, menu?: unknown, sku: string } = await req.json();
        const items = json.items;
        const categories = json.categories;
        const menu = json.menu;
        const sku = json.sku ?? "MISC-" + Math.floor(Math.random() * 1000)



        // const auth = req.headers.get("Authorization");
        // if (!auth) {
            
        //     return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        // }
        // const user = await (User as any).verify(auth);
        // if (!user) {
        //     return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        // }

        try {
            await this.kafka([{
                key: "item.add",
                value: sku
            }])
            const entities = new Item({
                sku,
                name: json.name,
                description: json.description,
                price: json.price

            });
        
            await entities.save()
            log.withMetadata({ entities }).trace("Added new item to repository");
            return Response.json({ success: true, data: entities }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/menu/add", 0)
    async addMenu(req: Request): Promise<Response> {
        const { items, categories } = await req.json() as IMenu[];
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
        let categories  = await req.json() as  ICategory[] ;
        try {
            if (!categories) return Response.json({ success: false, message: "No categories provided" }, { status: 400 });
            
            if (!categories || categories.length === 0) {
                return Response.json({ success: false, message: "No categories provided" }, { status: 400 });
            };


            
            categories.map(async (cat) => {
                const newCategory = new Category({
                    id: cat.id,
                    name: cat.name,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastTouched: new Date(),
                    lastTouchedBy: null as any,
                });



                await newCategory.save();
            });

            return Response.json({ success: true, data: categories }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/user/add", 0)
    async addUser(req: Request): Promise<Response> {
        const { username, password }= await req.json() as { username: string, password: string };
        try {
            const newUser = new User({
                username: username,
                passwordHash: hash("sha256", password).toString(),
                role: "Admin",
                extraPermissions: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await newUser.save();
            return Response.json({ success: true, data: newUser }, { status: 200 });
        }
        catch (error) {
            log.error('Error creating user: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }
}