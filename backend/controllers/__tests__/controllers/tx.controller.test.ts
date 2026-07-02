import { mock, test, expect, describe, beforeEach } from "bun:test";

const mockConnect = mock();
const mockSend = mock();
const mockCommit = mock();
const mockAbort = mock();

mock.module("../../events/kafka", () => {
    return {
        kafka: {
            producer: () => ({
                connect: mockConnect,
                send: mockSend,
                commit: mockCommit,
                abort: mockAbort
            })
        })
    };
});

mock.module("../../index", () => {
    return {
        log: {
            info: mock(),
            error: mock(),
            withMetadata: () => ({ info: mock() })
        }
    };
});

import { TXController } from "../../tx.controller";

describe("TXController", () => {
    let controller: TXController;

    beforeEach(() => {
        controller = new TXController();
        mockConnect.mockClear();
        mockSend.mockClear();
        mockCommit.mockClear();
        mockAbort.mockClear();
    });

    test("newTx should create transaction and connect producer", async () => {
        const txId = await controller.newTx();
        expect(typeof txId).toBe("string");
        expect(mockConnect).toHaveBeenCalled();
    });

    test("getNewTx should return txId in response", async () => {
        const req = new Request("http://localhost/tx/new");
        const res = await controller.getNewTx(req);
        expect(res.status).toBe(200);
        const json = await res.json() as { success: boolean; data: string };
        expect(json.success).toBe(true);
        expect(typeof json.data).toBe("string");
    });

    test("addItem should send item.added message", async () => {
        const txId = await controller.newTx();
        const req = new Request("http://localhost/tx/add/item", {
            method: "POST",
            body: JSON.stringify({ id: txId, item: { id: 1, name: "test item" } })
        });
        const res = await controller.addItem(req);
        expect(res.status).toBe(200);
        expect(mockSend).toHaveBeenCalled();
        const callArgs = mockSend.mock.calls[0][0];
        expect(callArgs.topic).toBe("tx");
    });

    test("removeItem should send item.removed message", async () => {
        const txId = await controller.newTx();
        const req = new Request("http://localhost/tx/remove/item", {
            method: "POST",
            body: JSON.stringify({ id: txId, item: { id: 1 } })
        });
        const res = await controller.removeItem(req);
        expect(res.status).toBe(200);
        expect(mockSend).toHaveBeenCalled();
    });

    test("commit should commit transaction", async () => {
        const txId = await controller.newTx();
        const req = new Request("http://localhost/tx/commit", {
            method: "POST",
            body: JSON.stringify({ id: txId })
        });
        const res = await controller.commit(req);
        expect(res.status).toBe(200);
        expect(mockCommit).toHaveBeenCalled();
    });

    test("abort should abort transaction", async () => {
        const txId = await controller.newTx();
        const req = new Request("http://localhost/tx/abort", {
            method: "POST",
            body: JSON.stringify({ id: txId })
        });
        const res = await controller.abort(req);
        expect(res.status).toBe(200);
        expect(mockAbort).toHaveBeenCalled();
    });
});
