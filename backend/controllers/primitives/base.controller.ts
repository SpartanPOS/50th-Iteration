import { getProducer } from '../../events/kafka.ts'
import type { Message } from 'kafkajs'

interface options {
    topic: string
}

export class BaseController {
    kafka: (msg: Message[]) => Promise<void>;

    constructor(options: options) {
        this.kafka = async (msg: Message[]) => {
            const producer = await getProducer();
            await producer.send({
                topic: options.topic,
                messages: msg
            })
        }
    }
}