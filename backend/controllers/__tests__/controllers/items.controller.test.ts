import { mock, test, expect, describe, beforeAll, beforeEach } from "bun:test";

import { ItemController } from "../../items.controller";

import { getAuthTokens } from "./auth-fixture.test";

import redis from "../../../redis.ts";
import { Item } from "../../../model/items.model.ts";

await redis.flushall();

function seedItems() {
    let item1 = new Item({
        id: 1,
        name: "Item 1",
        price: 10.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: null as any,
    });

    let item2 = new Item({
        id: 2,
        name: "Item 2",
        price: 20.0,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTouched: new Date(),
        lastTouchedBy: null as any,
    });

    return Promise.all([item1.save(), item2.save()]);
}

describe("ItemController", () => {
    let controller: ItemController;
    let adminToken = "";
    let cashierToken = "";

    beforeAll(async () => {
        const tokens = await getAuthTokens();
        adminToken = tokens.adminToken;
        cashierToken = tokens.cashierToken;
        await seedItems();
    });

    beforeEach(async () => {
        controller = new ItemController();
    });

    test("getItems should return items for admin", async () => {
        const req = new Request("http://localhost/items", {
            method: "GET",
            headers: { "Authorization": `Bearer ${adminToken}` }
        });
        const res = await controller.getAllItems(req);
        expect(res.status).toBe(200);
        const json = await res.json() as { success: boolean; data: any[] };
        expect(json.success).toBe(true);
        expect(Array.isArray(json.data)).toBe(true);
    });

    test("getItems should return items for cashier", async () => {
        const req = new Request("http://localhost/items", {
            method: "GET",
            headers: { "Authorization": `Bearer ${cashierToken}` }
        });
        const res = await controller.getItems(req);
        expect(res.status).toBe(200);
        const json = await res.json() as { success: boolean; data: any[] };
        expect(json.success).toBe(true);
        expect(Array.isArray(json.data)).toBe(true);
    });

});