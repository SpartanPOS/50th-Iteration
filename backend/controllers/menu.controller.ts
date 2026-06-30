import { Controller, Get } from '../decorator';
import { Menu } from '../model/menu.model';
import { log } from '../index';
import { BaseController } from './primitives/base.controller';

@Controller("/menu")
export class MenuController extends BaseController{
    constructor() {
        super({ topic: "menu" });
    }

    @Get("/", 0)
    async getAllItems(_req?: Request) {
        const data = await Menu.getAll();
        log.withMetadata({ data }).trace("Get all items");
        return Response.json(data);
    }

    @Get("/:id", 0)
    async getItemById(req: Request) {
        const data = await req.json() as { id: string }
        log.withMetadata({ data }).trace("Get item by ID");
        const item = await Menu.byId(data.id)
        return Response.json(item)
    }
}