import { Kafka, Partitioners } from 'kafkajs';
import { LogLayer } from 'loglayer';
import { getSimplePrettyTerminal } from "@loglayer/transport-simple-pretty-terminal";



export const log = new LogLayer({
    prefix: "[ Kafka ]",
    transport: getSimplePrettyTerminal({
        runtime: "node",
        viewMode: "inline"
    })
});

export const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
});

kafka.admin().connect().then(() => {
    log.info("Connected to Kafka broker");
}).catch((error) => {
    log.error("Error connecting to Kafka broker: " + error);
    process.exit(1);
});

//log each producer disconnect with reason for disconnect
kafka.producer().on('producer.disconnect', (event) => {
    log.info("Producer disconnected: " + event);
}); 

export const producer = await kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000
});

if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {

    log.info("Connecting to Kafka broker...");

    await producer.connect();

    await producer.send({
        topic: 'status',
        messages: [
            {
                key: 'client',
                value: 'Connected 1'
            }
        ]
    })

    await producer.disconnect();
}