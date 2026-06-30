import { log } from "../index";
import { Controller, Get } from "../decorator";
import { Item } from "../model/items.model";
import { BaseController } from "./primitives/base.controller";

@Controller("/items")
export class ItemController extends BaseController {
    constructor() {
        super("items");
    }

    @Get("/", 0)
    getAllItems(_req?: Request) {
        const data = Item.getAll();
        log.withMetadata({ data }).trace("Get all items");
        return Response.json(data);
    }

    @Get("/:id", 0)
    async getItemById(req: Request) {
        const data = await req.json() as { id: string }
        log.withMetadata({ data }).trace("Get item by ID");
        const item = await Item.byId(data.id)
        return Response.json(item)
    }
}
