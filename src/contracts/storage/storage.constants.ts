export const STORAGE_BUCKETS = ["episodes", "ads", "generated"] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

const storageBucketSet = new Set<string>(STORAGE_BUCKETS);

export function isStorageBucket(value: string): value is StorageBucket {
  return storageBucketSet.has(value);
}
