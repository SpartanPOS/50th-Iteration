import { Kafka, Partitioners } from 'kafkajs';


export const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
});

export const producer = kafka.producer({
    createPartitioner: Partitioners.LegacyPartitioner
});

if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
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