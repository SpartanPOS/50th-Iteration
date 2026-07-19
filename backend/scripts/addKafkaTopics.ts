import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
    clientId: "50thStoreBackend",
    brokers: ["localhost:9092"],
    logLevel: logLevel.INFO,
});

//add kafka topics if they don't exist
const admin = kafka.admin();

admin.connect().then(async () => {
    const topics = await admin.listTopics();
    const requiredTopics = ["orders",  "users", "config"];
    for (const topic of requiredTopics) {
        if (!topics.includes(topic)) {
            await admin.createTopics({
                topics: [{ topic }]
            });
        }
    }
});