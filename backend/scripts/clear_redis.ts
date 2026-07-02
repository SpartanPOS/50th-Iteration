import redis from '../redis';

function clearRedis() {
    redis.flushAll().then(() => {
        console.log("Redis cache cleared.");
        process.exit(0);
    }).catch((err) => {
        console.error("Error clearing Redis cache:", err);
        process.exit(1);
    });
}

clearRedis();