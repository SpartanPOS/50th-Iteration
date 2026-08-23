import { log } from '../index';
import { Controller, Get } from '../decorator';
import { Item } from '../model/items.model';
import { BaseController } from './primitives/base.controller';

@Controller('/items')
export class ItemController extends BaseController {
    constructor() {
        super({ topic: 'items' });
    }

    @Get('/', 0)
    async getAllItems(_req?: Request) {
        const data = await Item.getAll();
        log.trace(`Get all items: ${data}`);
        await this.kafka([{
            key: "item.getAll",
            value: Date().toString()
        }]);
        return Response.json(data);
    }

    @Get('/:id', 0)
    async getItemById(_req: Request, params?: Record<string, string>) {
        const itemId = params?.id;
        log.withMetadata({ itemId }).trace('Get item by ID');
        if (!itemId) {
            return Response.json({ error: 'Missing item id' }, { status: 400 });
        }
        const item = await Item.byId(itemId)
        log.withMetadata({ itemId, item }).trace('Get item by ID result');
        await this.kafka([{
            key: "item.getById",
            value: itemId
        }]);
        
        return Response.json(item)
    }
}
