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

const redis = createClient()
log.info('Initializing Redis client...')
redis.on('error', (err) => log.error('Redis Client Error', err));
if (process.env.NODE_ENV !== "test" && process.env.BUN_ENV !== "test") {
    await redis.connect()
}
// Wait until client is ready

export default redis