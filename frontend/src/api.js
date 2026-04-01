const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const CACHE_PREFIX = "economy-api-cache:";
const DEFAULT_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;
const memoryCache = new Map();

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function buildCacheKey(path, token) {
  return `${token ? `auth:${token}` : "public"}:${path}`;
}

function isValidEntry(entry) {
  return Boolean(entry && entry.expiresAt && entry.expiresAt > Date.now());
}

function enforceCacheLimit() {
  while (memoryCache.size > MAX_CACHE_SIZE) {
    const oldestKey = memoryCache.keys().next().value;
    if (!oldestKey) break;
    memoryCache.delete(oldestKey);
  }
}

function rememberEntry(cacheKey, entry) {
  if (memoryCache.has(cacheKey)) {
    memoryCache.delete(cacheKey);
  }

  memoryCache.set(cacheKey, entry);
  enforceCacheLimit();
}

function readStorageEntry(cacheKey) {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(`${CACHE_PREFIX}${cacheKey}`);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    if (isValidEntry(entry)) {
      rememberEntry(cacheKey, entry);
      return entry;
    }

    storage.removeItem(`${CACHE_PREFIX}${cacheKey}`);
  } catch {
    return null;
  }

  return null;
}

function writeCacheEntry(cacheKey, data, ttlMs) {
  const entry = {
    data,
    expiresAt: Date.now() + ttlMs
  };

  rememberEntry(cacheKey, entry);

  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(`${CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry));
    } catch {
      // Ignore storage write failures and keep the in-memory cache.
    }
  }

  return data;
}

export function peekApiCache(path, token) {
  const cacheKey = buildCacheKey(path, token);
  const entry = memoryCache.get(cacheKey) || readStorageEntry(cacheKey);
  return isValidEntry(entry) ? entry.data : null;
}

export function clearApiCache(prefix = "") {
  const matchesPrefix = (key) => !prefix || key.includes(prefix);

  for (const key of Array.from(memoryCache.keys())) {
    if (matchesPrefix(key)) {
      memoryCache.delete(key);
    }
  }

  const storage = getStorage();
  if (storage) {
    try {
      for (let index = storage.length - 1; index >= 0; index -= 1) {
        const storageKey = storage.key(index);
        if (!storageKey?.startsWith(CACHE_PREFIX)) continue;

        const cacheKey = storageKey.slice(CACHE_PREFIX.length);
        if (matchesPrefix(cacheKey)) {
          storage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore storage cleanup failures.
    }
  }
}

async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

export async function apiGet(path, token, options = {}) {
  const {
    cache = true,
    force = false,
    ttlMs = DEFAULT_TTL_MS
  } = options;

  const cacheKey = buildCacheKey(path, token);

  if (cache && !force) {
    const cached = peekApiCache(path, token);
    if (cached !== null) {
      return cached;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  const data = await handleResponse(response);

  if (cache) {
    writeCacheEntry(cacheKey, data, ttlMs);
  }

  return data;
}

export async function apiPost(path, body, token, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await handleResponse(response);

  for (const prefix of options.invalidatePrefixes || []) {
    clearApiCache(prefix);
  }

  if (options.invalidateAll) {
    clearApiCache();
  }

  return data;
}
