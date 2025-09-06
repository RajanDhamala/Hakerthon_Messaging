// redisClient.ts
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const RedisClient = createClient({
  url: process.env.REDIS_URL,
});

RedisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

const connectRedis = async () => {
  if (!RedisClient.isOpen) {
    await RedisClient.connect();
    console.log('Connected to Redis');
  }
};

export { RedisClient, connectRedis };
