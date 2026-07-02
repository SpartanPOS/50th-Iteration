import { mock, test, expect, describe, beforeEach } from "bun:test";

import { ItemController } from "../../items.controller";

import { adminToken, cashierToken } from "./users.controller.test";

describe("ItemController", () => {
    let controller: ItemController;

    beforeEach(() => {
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