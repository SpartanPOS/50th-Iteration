import { log } from "../index";
import { Controller, Get, Post } from "../decorator";
import type { ITX } from "../model/tx.model";
import { kafka } from "../events/kafka";
import { randomUUIDv7 } from "bun";
import type { Producer } from "kafkajs";
import { Partitioners } from "kafkajs";
import { Stripe  } from "stripe";
import { error } from "console";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    typescript: true,
});
import { BaseController } from "./primitives/base.controller";



@Controller("/tx")
export class TXController extends BaseController {

    constructor() {
        super({ topic: "tx" });
    }

    protected transactions = new Map<string, any>();

    // async newTx(): Promise<string> {
    //     try {
            
    //         let producer = kafka.producer({
    //             transactionalId: ,
    //             createPartitioner: Partitioners.LegacyPartitioner
    //         });
    //         await producer.connect();


    //         this.transactions.set(txId, producer)
    //         return txId
    //     } catch (error) {
    //         log.error('Error creating new transaction: ' + error);
    //         return "" + error
    //     }
    // }

    @Post("/new", 0)
    async getNewTx(req: Request): Promise<Response> {
        let data = await req.json();


        try {
            let tx = stripe.paymentIntents.create({
                amount: data.amount,
                currency: "usd",
                payment_method_types: ["card_present"],
                capture_method: 'automatic',
                payment_method_options: {
                card_present: {
                    capture_method: 'manual_preferred'
                }
    }
            });
            
            return Response.json({ success: true, data: (await tx).id }, { status: 200 });
        } catch (error) {
            log.error('Error creating transaction: ' + error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }

    @Post("/process", 0)
    async processPaymentIntent(req: Request): Promise<Response> {

        const data = await req.json() as {
            payment_intent_id: string;
            reader_id?: string;
        };
        const readerId = data.reader_id || "tmr_GocmjwFFBE18rB";
        let attempt = 0;
        const tries = 3;
        while (true) {
            attempt++;
            try {
                const reader = await stripe.terminal.readers.processPaymentIntent(
                    readerId,
                    {
                    payment_intent: data.payment_intent_id,
                    }
                );

                const deadline = Date.now() + 120_000;
                let currentReader = reader;
                while (currentReader.action?.status === "in_progress" && Date.now() < deadline) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retrievedReader = await stripe.terminal.readers.retrieve(readerId);
                    if (!("action" in retrievedReader)) {
                        return Response.json(
                            { success: false, data: retrievedReader },
                            { status: 502 }
                        );
                    }
                    currentReader = retrievedReader;
                }

                if (currentReader.action?.status !== "succeeded") {
                    return Response.json(
                        { success: false, data: currentReader },
                        { status: 502 }
                    );
                }

                return Response.json({ success: true, data: currentReader }, { status: 200 });
            } catch (error) {
                console.debug( JSON.stringify(await stripe.terminal.readers.list({ location: location.id })) ); 

                console.log(error);
                switch (error.code) {
                    case "terminal_reader_timeout":
                // Temporary networking blip, automatically retry a few times.
                        if (attempt == tries) {
                            return Response.json({ success: false, error: error }, { status: 500 });
                        }
                        break;
                    case "terminal_reader_offline":
                // Reader is offline and won't respond to API requests. Make sure the reader is powered on
                // and connected to the internet before retrying.
                        return Response.json({ success: false, error: error }, { status: 500 });
                    case "terminal_reader_busy":
                // Reader is currently busy processing another request, installing updates or changing settings.
                // Remember to disable the pay button in your point-of-sale application while waiting for a
                // reader to respond to an API request.
                        return Response.json({ success: false, error: error }, { status: 500 });
                    case "intent_invalid_state":
                // Check PaymentIntent status because it's not ready to be processed. It might have been already
                // successfully processed or canceled.
                        const paymentIntent = await stripe.paymentIntents.retrieve(
                            data.payment_intent_id
                        );
                        console.log(
                            "PaymentIntent is already in " + paymentIntent.status + " state."
                        );
                        return Response.json({ success: false, error: error }, { status: 500 });
                    default:
                        return Response.json({ success: false, error: error }, { status: 500 });

            }
            }
        }
    }     

    @Post("/capture", 0)
    async capturePaymentIntent(req: Request): Promise<Response> {
        let data = await req.json();
        const proc = await stripe.testHelpers.terminal.readers.presentPaymentMethod(
        reader.id,
        {
          card_present: {
            number: data.card_number,
          },
          type: "card_present",
        }
      );

        return Response.json({ success: true, data: reader }, { status: 200 });
    };

}
