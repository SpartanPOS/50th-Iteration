import { log } from "../index";
import { Controller, Get, Post } from "../decorator";
import type { ITX } from "../model/tx.model";
import { kafka } from "../events/kafka";
import { randomUUIDv7 } from "bun";
import type { Producer } from "kafkajs";
import { Partitioners } from "kafkajs";
import { Stripe  } from "stripe";
import { error } from "console";
import { BaseController } from "./primitives/base.controller";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    typescript: true,
});


@Controller('/tx')
export class TXController extends BaseController {
    readerId: Promise<string>;

    constructor() {
        super({ topic: 'tx' });
        this.readerId = stripe.terminal.readers.list({ limit: 1 }).then((readers) => {
            if (!readers || readers.data.length === 0) {
                throw new Error("No readers found");
            }

            return readers.data[0]?.id || "";
        }).catch((error) => {
            log.error("Error fetching reader ID: " + error);
            throw new Error("Error fetching reader ID: " + error);
        });
    }

    protected transactions = new Map<string, any>();

    async newTx(): Promise<string> {

        let intent = await stripe.paymentIntents.create({
            amount: 1000,
            currency: 'usd',
            payment_method_types: ['card_present'],
            capture_method: 'automatic',
            payment_method_options: {
                card_present: {
                    capture_method: 'manual_preferred'
                }
            }
        });

        try {
            let producer: any = kafka.producer({
                transactionalId: intent.id,
            });
            await producer.connect();

            this.transactions.set(intent.id, producer)
            return intent.id
        } catch (error) {
            log.error('Error creating new transaction: ' + error);
            return "" + error
        }
    }

    @Post("/new", 0)
    async getNewTx(req: Request): Promise<Response> {
        try {
            const txId = await this.newTx();
            return Response.json({ success: true, data: txId }, { status: 200 });
        } catch (error) {
            log.error('Error creating transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/process", 0)
    async processTx(req: Request): Promise<Response> {
        const data = await req.json() as { payment_intent_id: string, reader_id: string };
        log.withMetadata({ data }).trace('Processing transaction');
        var attempt = 0;
        const tries = 3;
        while (true) {
                attempt++;
                try {
                const reader = await stripe.terminal.readers.processPaymentIntent(
                    await this.readerId,
                    { payment_intent: data.payment_intent_id }
                );
                let currentReader = reader;
                const deadline = Date.now() + 120_000;

                while (
                    currentReader.action?.status === "in_progress" &&
                    Date.now() < deadline
                ) {
                    await Bun.sleep(1000);

                    const updatedReader =
                        await stripe.terminal.readers.retrieve(await this.readerId);

                    if (!("action" in updatedReader)) {
                        return Response.json({ error: "Reader was deleted" }, { status: 502 });
                    }

                    currentReader = updatedReader;
                }

                if (currentReader.action?.status !== "succeeded") {
                    return Response.json(
                        { success: false, reader: currentReader },
                        { status: 502 }
                    );
                }
                await stripe.paymentIntents.capture(data.payment_intent_id);
                return Response.json(
                    { success: true, reader: currentReader },
                    { status: 200 }
                );
            } catch (error) {
                const stripeError = error as { code?: string; message?: string };
                const errorMessage = stripeError.message ?? String(error);
                log.error(errorMessage);
                switch (stripeError.code) {
                    case "terminal_reader_timeout":
                    // Temporary networking blip, automatically retry a few times.
                        if (attempt == tries) {
                            return Response.json({ error: errorMessage }, { status: 500 });
                        }
                        break;
                    case "terminal_reader_offline":
                    // Reader is offline and won't respond to API requests. Make sure the reader is powered on
                    // and connected to the internet before retrying.
                        return Response.json({ error: errorMessage }, { status: 500 });
                    case "intent_invalid_state":
                    // Check PaymentIntent status because it's not ready to be processed. It might have been already
                    // successfully processed or canceled.
                        const paymentIntent = await stripe.paymentIntents.retrieve(
                            data.payment_intent_id
                        );
                        console.log(
                            "PaymentIntent is already in " + paymentIntent.status + " state."
                        );
                        return Response.json({ error: errorMessage }, { status: 500 });
                    default:
                        return Response.json({ error: errorMessage }, { status: 500 });
            }
            }
        }
    }

    @Post("/simulate", 0)
    async simulateTx(req: Request): Promise<Response> {
        const data = await req.json() as { payment_intent_id: string, card_number: string, reader_id: string };
        const reader = await stripe.testHelpers.terminal.readers.presentPaymentMethod(
        await this.readerId,
        {
        card_present: {
            number: data.card_number,
        },
        type: "card_present",
        }

    );
            return Response.json({ success: true, reader }, { status: 200 })
}
    
    

}
