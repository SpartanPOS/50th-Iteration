import { kafka } from "../events/kafka";
import type { ServerWebSocket } from "bun";

let clients: ServerWebSocket[] = [];

let consumer = await kafka.consumer({
    groupId: "ws-clients",
})

async function processMessage(topic: string, partition: number, message: any) {
    //in the future, run through schema on what actually gets sent

    return {key: message.key.toString(), message: message.value.toString(), topic, partition, timestamp: message.timestamp};
}

async function handleKafkaMessage(topic: string, partition: number, message: any) {
    const processedMessage = await processMessage(topic, partition, message);
    clients.forEach(client => {
        client.send(JSON.stringify(processedMessage));
    });
}

await consumer.subscribe({
    topic: /^(?!_).*$/,
    fromBeginning: false
})

consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
        await handleKafkaMessage(topic, partition, message);
    },
})

export async function onNewClient(client: ServerWebSocket) {
    clients.push(client);
    return true;
}

export async function onMessage(message: any) {
    clients.forEach(client => {
        client.send(JSON.stringify(message));
    });
}
