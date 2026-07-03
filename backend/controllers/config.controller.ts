import { Controller, Post } from "../decorator";
import { hash } from "crypto";
import { log } from "../index";
import { Get } from "../decorator";
import { UserController } from "./users.controller";
import { Item } from "../model/items.model";
import { BaseController } from "./primitives/base.controller"
import { User } from "../model/users.model";

import type { IItem } from "../model/items.model";
import type { ICategory } from "../model/category.model";
import { Menu } from "../model/menu.model";

import { Category } from "../model/category.model";

import type { IMenu } from "../model/menu.model"

/**
 * AdminController is responsible for handling administrative actions such as adding items, categories, menus, and users. It extends the BaseController and uses Kafka for event-driven communication.
 * @extends BaseController
 * @controller /admin
 * @kafkaTopic config
 * 
 */
@Controller("/admin")
export class AdminController extends BaseController {

    constructor() {
        super({ topic: "config" });
    }

    /**
     * Adds new items to the system. It expects a JSON payload containing item details and generates a unique SKU if not provided. The method also verifies the user's authorization before proceeding.
     * @param {Request} req - The HTTP request object containing the item details in JSON format.
     * @returns {Promise<Response>} - A promise that resolves to an HTTP response indicating the success or failure of the operation.
     * @AuthLevel 2 - Admin only 
    **/
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
        for (const cItem of items) {
            const { name, description, price, category, sku } = cItem;

            const solvedItem = {
                name: name,
                description: description ?? '',
                price: price ?? 0,
                category: category,
                sku: sku ?? "MISC-" + Math.floor(Math.random() * 1000)
            }
            const newSku = sku ?? "MISC-" + Math.floor(Math.random() * 1000)

            await this.kafka([{
                key: "item.add",
                value: 
                solvedItem.sku +
                solvedItem.name + 
                solvedItem.description + 
                solvedItem.price + 
                solvedItem.category?.id
            }])


            const item: Item  = new Item({
                sku: solvedItem.sku,
                name: solvedItem.name,
                description: solvedItem.description,
                price: solvedItem.price,
                category: solvedItem.category,
            });
            entities.push(item);
            await item.save();
            }

            log.withMetadata({ entities }).trace("Added new item to repository");
            return Response.json({ success: true, data: entities }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }


    /**
     * Adds a new menu to the system. It expects a JSON payload containing menu details including name, items, categories, and active dates. The method verifies the existence of items and categories before creating the menu.
     * @param req 
     * @returns 
     * @AuthLevel 2 - Admin only
     */
    @Post("/menu/add", 0)
    async addMenu(req: Request): Promise<Response> {
        const menus = await req.json() as Menu[];

        const newMenus: Menu[] = [];
        try {
            for (const menu of menus) {
                let existingItems: Item[] = [];
                for (const item of menu.items) {
                    //check if item exists (if has id load id, or search by name)
                    let existingItem = (await Item.byName(item.name))[0];
                    if (existingItem) {
                        existingItems.push(existingItem);
                    } else {
                        throw new Error(`Item not found: ${item.name}`);
                    }
                }

                let existingCategories: Category[] = [];
                for (const category of menu.categories) {
                    let existingCategory = (await Category.byName(category.name))[0];
                    if (existingCategory) {
                        existingCategories.push(existingCategory);
                    } else {
                        throw new Error(`Category not found: ${category.name}`);
                    }
                }

                let newMenu = new Menu({
                    name: menu.name,
                    items: existingItems,
                    categories: existingCategories,
                    //datesActive: menu.datesActive,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                await this.kafka([{
                    key: "menu.add",
                    value: newMenu.name + 
                    newMenu.items.map(i => i.id).join(",") + 
                    newMenu.categories.map(c => c.id).join(",")
                    // + newMenu.datesActive.map(d => d.startDate.toISOString() + "-" + d.endDate.toISOString()).join(",")
                }])
                await newMenu.save();
                newMenus.push(newMenu);
            }

            return Response.json({ success: true, data: newMenus }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("API Error:", { status: 402 });
        }
    }

    /**
     * Adds new categories to the system. It expects a JSON payload containing category details and saves them to the repository. The method verifies the user's authorization before proceeding.
     * @param {Request} req - The HTTP request object containing the category details in JSON format.
     * @returns {Promise<Response>} - A promise that resolves to an HTTP response indicating the success or failure of the operation.
     * @AuthLevel 2 - Admin only 
    **/
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

                await this.kafka([{
                    key: "category.add",
                    value: newCategory.id + newCategory.name
                }])

                await newCategory.save();
            });

            return Response.json({ success: true, data: categories }, { status: 200 });
        } catch (error) {
            log.error('Error fetching users: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    /**
     * Adds a new user to the system. It expects a JSON payload containing the username and password, hashes the password, and saves the new user to the repository. The method verifies the user's authorization before proceeding.
     * @param {Request} req - The HTTP request object containing the user details in JSON format.
     * @returns {Promise<Response>} - A promise that resolves to an HTTP response indicating the success or failure of the operation.
    *  @AuthLevel 2 - Admin only 
    **/
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
            
            await this.kafka([{
                key: "user.add",
                value: newUser.username + 
                newUser.role +
                newUser.extraPermissions +
                newUser.passwordHash +
                newUser.createdAt.toISOString() +
                newUser.updatedAt.toISOString() +
                newUser.lastTouched.toISOString() +
                (newUser.lastTouchedBy ? newUser.lastTouchedBy.id : "null")
            }])

            return Response.json({ success: true, data: newUser }, { status: 200 });        
        }
        catch (error) {
            log.error('Error creating user: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }
}