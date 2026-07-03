import Redis from 'ioredis';

let redis: Redis | null = null;
const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
    redis.on('error', (err) => {
      console.error('[Redis Error]', err);
    });
  } catch (err) {
    console.error('Failed to initialize Redis client for rate limiting:', err);
  }
} else {
  console.log('[RateLimiter] REDIS_URL not configured. Using local in-memory rate limiting.');
}

// In-memory fallback structure
interface Bucket {
  tokens: number;
  lastRefill: number;
}
const localBuckets = new Map<string, Bucket>();

// Lua Script for atomic Redis token bucket evaluation
const tokenBucketScript = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4] or 1)

  local data = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(data[1])
  local last_refill = tonumber(data[2])

  if not tokens then
    tokens = capacity
    last_refill = now
  else
    local elapsed = math.max(0, now - last_refill) / 1000
    tokens = math.min(capacity, tokens + (elapsed * refill_rate))
    last_refill = now
  end

  if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    redis.call('EXPIRE', key, 86400) -- Clean up after 1 day of inactivity
    return {1, tokens}
  else
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    return {0, tokens}
  end
`;

/**
 * Atomic token bucket rate limiter.
 * @param key Unique key representing client (e.g. rate_limit:auth:ip_address)
 * @param capacity Maximum burst capacity of the bucket
 * @param refillRate Refill rate in tokens per second (e.g. 0.1 means 1 token per 10 seconds)
 */
export async function rateLimitRequest(
  key: string,
  capacity: number,
  refillRate: number
): Promise<{ success: boolean; remaining: number }> {
  const now = Date.now();

  if (redis) {
    try {
      const res = await redis.eval(
        tokenBucketScript,
        1,
        key,
        capacity.toString(),
        refillRate.toString(),
        now.toString(),
        '1'
      ) as [number, number];

      const success = res[0] === 1;
      const remaining = Math.max(0, Math.floor(res[1]));

      return { success, remaining };
    } catch (err) {
      console.error('[RateLimiter] Redis connection failed, falling back to local memory:', err);
    }
  }

  // Local Memory Fallback (replicates the Lua logic)
  let bucket = localBuckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
  } else {
    const elapsed = Math.max(0, now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + (elapsed * refillRate));
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    localBuckets.set(key, bucket);
    return { success: true, remaining: Math.floor(bucket.tokens) };
  } else {
    localBuckets.set(key, bucket);
    return { success: false, remaining: 0 };
  }
}
