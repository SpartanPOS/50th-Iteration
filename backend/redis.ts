import { createClient } from 'redis'
import { LogLayer } from "loglayer";
import { getSimplePrettyTerminal } from "@loglayer/transport-simple-pretty-terminal";

const log = new LogLayer({
    prefix: "[Redis Client]",
    transport: getSimplePrettyTerminal({
        runtime: "node",
        viewMode: "inline"
    })
});

const isTestEnv = process.env.NODE_ENV === "test" || process.env.BUN_ENV === "test";

const redis: any = isTestEnv ? new Redis() : createClient();

if (isTestEnv) {
    log.info('Skipping Redis connection in test environment...');
} else {
    log.info('Initializing Redis client...');
    redis.on('error', (err: Error) => log.error('Redis Client Error', err.message));
    await redis.connect();
}

export default redis