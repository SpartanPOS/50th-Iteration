import { Kafka, Partitioners, type Producer } from 'kafkajs';
import { LogLayer } from 'loglayer';
import { getSimplePrettyTerminal } from '@loglayer/transport-simple-pretty-terminal';

export const log = new LogLayer({
    prefix: '[ Kafka ]',
    transport: getSimplePrettyTerminal({
        runtime: 'node',
        viewMode: 'inline'
    })
});

export const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
});

let sharedProducer: Producer | null = null;
let sharedProducerConnectPromise: Promise<Producer> | null = null;
let sharedProducerClosed = false;

async function createSharedProducer(): Promise<Producer> {
    if (sharedProducerClosed) {
        sharedProducerClosed = false;
    }

    if (sharedProducer) {
        return sharedProducer;
    }

    if (!sharedProducerConnectPromise) {
        sharedProducer = kafka.producer({
            allowAutoTopicCreation: true,
        });

        sharedProducerConnectPromise = sharedProducer.connect().then(async () => {
            log.info('Connected to Kafka broker');
            return sharedProducer as Producer;
        }).catch((error) => {
            sharedProducer = null;
            sharedProducerConnectPromise = null;
            throw error;
        });
    }

    return sharedProducerConnectPromise;
}

export async function getProducer(): Promise<Producer> {
    return createSharedProducer();
}

export async function closeKafka(): Promise<void> {
    if (sharedProducerClosed) return;
    sharedProducerClosed = true;

    const producer = sharedProducer;
    sharedProducer = null;
    sharedProducerConnectPromise = null;

    if (!producer) return;

    try {
        await producer.disconnect();
        log.info('Kafka producer disconnected');
    } catch (error) {
        log.error('Error disconnecting Kafka producer: ' + error);
    }
}

process.once('beforeExit', () => {
    void closeKafka();
});

process.once('SIGINT', () => {
    void closeKafka().finally(() => process.exit(0));
});

process.once('SIGTERM', () => {
    void closeKafka().finally(() => process.exit(0));
});

export function createTransactionalProducer(transactionalId: string) {
    return kafka.producer({
        transactionalId,
        createPartitioner: Partitioners.LegacyPartitioner,
    });
}
