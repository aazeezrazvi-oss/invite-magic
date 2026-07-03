import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';

// Setup Redis
let redis: Redis | null = null;
const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
    });
  } catch (err) {
    console.error('Failed to initialize Redis client for Bloom Filter:', err);
  }
}

// Bloom Filter Parameters
const BLOOM_FILTER_SIZE = 100000; // 100k bits
const NUM_HASH_FUNCTIONS = 4;
const REDIS_KEY = 'bf:invitation_slugs';

// Local memory fallback bit array
const localBitArray = new Uint8Array(Math.ceil(BLOOM_FILTER_SIZE / 8));

/**
 * Simple hashing function based on FNV-1a seeded polynomial rolling hash
 */
function getHash(str: string, seed: number): number {
  let h = seed ^ 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h % BLOOM_FILTER_SIZE);
}

// Track whether the filter has been populated from the database
let isInitialized = false;

/**
 * Adds a slug to the Bloom Filter (Redis or local memory)
 */
export async function addSlugToFilter(slug: string): Promise<void> {
  const cleanSlug = slug.trim().toLowerCase();
  
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      for (let i = 0; i < NUM_HASH_FUNCTIONS; i++) {
        const bitIndex = getHash(cleanSlug, i * 12345);
        pipeline.setbit(REDIS_KEY, bitIndex, 1);
      }
      await pipeline.exec();
      return;
    } catch (err) {
      console.error('[BloomFilter] Redis add failed, falling back to local memory:', err);
    }
  }

  // Fallback to local memory
  for (let i = 0; i < NUM_HASH_FUNCTIONS; i++) {
    const bitIndex = getHash(cleanSlug, i * 12345);
    const byteIndex = Math.floor(bitIndex / 8);
    const bitOffset = bitIndex % 8;
    localBitArray[byteIndex] |= (1 << bitOffset);
  }
}

/**
 * Checks if a slug is registered in the Bloom Filter.
 * Returns false only if the slug definitely DOES NOT exist.
 * Returns true if the slug MIGHT exist.
 */
export async function checkSlugExists(slug: string): Promise<boolean> {
  // Ensure the filter is populated
  if (!isInitialized) {
    await populateBloomFilter();
  }

  const cleanSlug = slug.trim().toLowerCase();

  if (redis) {
    try {
      const pipeline = redis.pipeline();
      for (let i = 0; i < NUM_HASH_FUNCTIONS; i++) {
        const bitIndex = getHash(cleanSlug, i * 12345);
        pipeline.getbit(REDIS_KEY, bitIndex);
      }
      const results = await pipeline.exec();
      if (results) {
        for (const res of results) {
          const error = res[0];
          const bitVal = res[1];
          if (error) throw error;
          if (bitVal === 0) {
            return false; // Definitely does not exist
          }
        }
        return true; // Might exist
      }
    } catch (err) {
      console.error('[BloomFilter] Redis get failed, falling back to local memory:', err);
    }
  }

  // Fallback to local memory checking
  for (let i = 0; i < NUM_HASH_FUNCTIONS; i++) {
    const bitIndex = getHash(cleanSlug, i * 12345);
    const byteIndex = Math.floor(bitIndex / 8);
    const bitOffset = bitIndex % 8;
    if ((localBitArray[byteIndex] & (1 << bitOffset)) === 0) {
      return false; // Definitely does not exist
    }
  }
  return true; // Might exist
}

/**
 * Queries the database for all slugs and populates the Bloom Filter.
 * Runs on startup or lazy-loads upon first request.
 */
export async function populateBloomFilter(): Promise<void> {
  if (isInitialized) return;
  console.log('[BloomFilter] Initializing Bloom Filter from database...');
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    // We can use a direct anonymous query since SELECT on public invitations is permitted
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: invitations, error } = await supabaseClient
      .from('invitations')
      .select('slug');

    if (error) throw error;

    if (invitations) {
      console.log(`[BloomFilter] Populating filter with ${invitations.length} slugs...`);
      for (const inv of invitations) {
        if (inv.slug) {
          await addSlugToFilter(inv.slug);
        }
      }
    }
    isInitialized = true;
    console.log('[BloomFilter] Bloom Filter successfully initialized.');
  } catch (err) {
    console.error('[BloomFilter] Failed to populate Bloom Filter:', err);
  }
}
