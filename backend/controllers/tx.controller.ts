import { log } from "../index";
import { Controller, Get, Post } from "../decorator";
import type { ITX } from "../model/tx.model";
import { kafka } from "../events/kafka";
import { randomUUIDv7 } from "bun";
import { BaseController } from "./primitives/base.controller";



@Controller("/tx")
export class TXController extends BaseController {

    constructor() {
        super({ topic: "tx" });
    }

    protected transactions = new Map<string, any>();

    async newTx(): Promise<string> {

        const txId = randomUUIDv7()

        try {
            let producer: any = kafka.producer({
                transactionalId: txId,
            });
            await producer.connect();


            this.transactions.set(txId, producer)
            return txId
        } catch (error) {
            log.error('Error creating new transaction: ' + error);
            return "" + error
        }
    }

    @Get("/new", 0)
    async getNewTx(req: Request): Promise<Response> {
        try {
            const txId = await this.newTx();
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error creating transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/add/item", 0)
    async addItem(req: Request): Promise<Response> {
        const json = (await req.json()) as { id: string; item: unknown };
        try {
            const txId = json.id as string;
            const tx = this.transactions.get(txId);
            if (!tx) {
                log.error('Transaction not found: ' + txId);
                return Response.json({ success: false, message: "Transaction not found" }, { status: 404 });
            }


            tx.send({
                topic: "tx",
                messages: [
                    {
                        key: txId,
                        value: JSON.stringify({
                            action: "item.added",
                            value: json.item
                        })
                    }
                ]
            })
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error creating transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/remove/item")
    async removeItem(req: Request): Promise<Response> {
        const json = (await req.json()) as { id: string; item: unknown };
        try {
            const txId = json.id as string;
            const tx = this.transactions.get(txId);
            if (!tx) {
                log.error('Transaction not found: ' + txId);
                return Response.json({ success: false, message: "Transaction not found" }, { status: 404 });
            }


            tx.send({
                topic: "tx",
                messages: [
                    {
                        key: txId,
                        value: JSON.stringify({
                            action: "item.removed",
                            value: json.item
                        })
                    }
                ]
            })
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error removing item: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/clear")
    async clear(req: Request): Promise<Response> {
        const json = (await req.json()) as { id: string };
        try {
            const txId = json.id as string;
            const tx = this.transactions.get(txId);
            if (!tx) {
                log.error('Transaction not found: ' + txId);
                return Response.json({ success: false, message: "Transaction not found" }, { status: 404 });
            }


            tx.send({
                topic: "tx",
                messages: [
                    {
                        key: txId,
                        value: JSON.stringify({
                            action: "clear",
                        })
                    }
                ]
            })
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error clearing transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/commit")
    async commit(req: Request): Promise<Response> {
        const json = (await req.json()) as { id: string };
        try {
            const txId = json.id as string;
            const tx = this.transactions.get(txId);
            if (!tx) {
                log.error('Transaction not found: ' + txId);
                return Response.json({ success: false, message: "Transaction not found" }, { status: 404 });
            }


            tx.send({
                topic: "tx",
                messages: [
                    {
                        key: txId,
                        value: JSON.stringify({
                            action: "commit",
                        })
                    }
                ]
            })
            await tx.commit();
            this.transactions.delete(txId);
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error committing transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/abort")
    async abort(req: Request): Promise<Response> {
        const json = (await req.json()) as { id: string };
        try {
            const txId = json.id as string;
            const tx = this.transactions.get(txId);
            if (!tx) {
                log.error('Transaction not found: ' + txId);
                return Response.json({ success: false, message: "Transaction not found" }, { status: 404 });
            }


            tx.send({
                topic: "tx",
                messages: [
                    {
                        key: txId,
                        value: JSON.stringify({
                            action: "abort",
                        })
                    }
                ]
            })
            await tx.abort();
            this.transactions.delete(txId);
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error aborting transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

}
