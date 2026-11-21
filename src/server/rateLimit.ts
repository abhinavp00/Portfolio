import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  timestamps: number[];
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number; label: string }) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const rawIp =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : '') ||
      req.ip ||
      'unknown';

    // Hash IP immediately so full IP addresses are never retained in memory or logs
    const key = crypto
      .createHash('sha256')
      .update(`${options.label}:${rawIp}`)
      .digest('hex')
      .slice(0, 24);

    const now = Date.now();
    const cutoff = now - options.windowMs;
    const bucket = buckets.get(key) || { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    if (bucket.timestamps.length >= options.maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait briefly before trying again.',
      });
      return;
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);

    // Periodic pruning to avoid unbounded memory growth
    if (buckets.size > 5000) {
      for (const [k, b] of buckets.entries()) {
        if (b.timestamps.every((ts) => ts <= cutoff)) {
          buckets.delete(k);
        }
      }
    }

    next();
  };
}
