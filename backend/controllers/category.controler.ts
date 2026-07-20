import { Controller, Get } from "../decorator";
import { BaseController } from "./primitives/base.controller";
import { Category } from "../model/category.model";
import { log } from "../index";

@Controller("/categories")
export class CategoryController extends BaseController {
    constructor() {
        super({ topic: "categories" });
    }

    @Get("/", 0)
    async getAllCategories() {
        try {
            const categories = await Category.getAll();
            log.trace(`Fetched ${categories.length} categories from repository`);
            let out = categories.map(category => {
                return {
                    id: category.id,
                    name: category.name,
                }
        });

            return Response.json(out);
        } catch (error) {
            console.error("Error fetching all categories:", error);
            return Response.json({ error: "Failed to fetch categories" }, { status: 500 });
        }
    }
}