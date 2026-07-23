import time
import gc
from collections import OrderedDict

from app.config import Config


class DatasetCache:
    def __init__(self, max_size=None, ttl=None, max_memory_bytes=None):
        self.cache = OrderedDict()
        self.max_size = max_size or Config.DATASET_CACHE_SIZE
        self.ttl = ttl or Config.DATASET_CACHE_TTL_SECONDS
        self.max_memory_bytes = max_memory_bytes or Config.dataset_cache_max_memory_bytes()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        if key not in self.cache:
            self.misses += 1
            return None
        entry = self.cache[key]
        if time.time() - entry["ts"] > self.ttl:
            del self.cache[key]
            self.misses += 1
            gc.collect()
            return None
        self.hits += 1
        self.cache.move_to_end(key)
        return entry["df"]

    def set(self, key, df):
        memory_estimate = df.memory_usage(deep=True).sum()
        if memory_estimate > self.max_memory_bytes:
            return

        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = {"df": df, "ts": time.time(), "bytes": memory_estimate}

        total = sum(e["bytes"] for e in self.cache.values())
        while total > self.max_memory_bytes and len(self.cache) > 1:
            _k, _v = self.cache.popitem(last=False)
            total -= _v["bytes"]
            gc.collect()

        while len(self.cache) > self.max_size:
            self.cache.popitem(last=False)
            gc.collect()

    def clear(self):
        self.cache.clear()
        gc.collect()


dataset_cache = DatasetCache()
