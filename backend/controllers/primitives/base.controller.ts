import {producer} from '../../events/kafka.ts'
import type { Message } from 'kafkajs'


interface options {
    topic: string
}

export class BaseController {
    kafka: Function;

    constructor(options: options) {
        producer.connect();
        this.kafka = (msg: Message[]) => {
            producer.send({
                topic: options.topic,
                messages: msg
            })
        }
    }


}