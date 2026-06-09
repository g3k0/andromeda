export type RateLimitBucket = {
  key: string;
  count: number;
  resetAt: Date;
};

export type RateLimitStore = {
  increment(
    key: string,
    limit: number,
    windowMs: number,
    now: Date,
  ): Promise<boolean>;
  clear(): Promise<void>;
};
