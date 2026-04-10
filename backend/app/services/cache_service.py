from collections import OrderedDict

# 🔥 LRU Cache (simple + effective)
class DatasetCache:
    def __init__(self, max_size=3):
        self.cache = OrderedDict()
        self.max_size = max_size

    def get(self, key):
        if key not in self.cache:
            return None
        
        # Move to end (recently used)
        self.cache.move_to_end(key)
        return self.cache[key]

    def set(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value

        # Remove oldest if full
        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)


# 🔥 GLOBAL CACHE INSTANCE
dataset_cache = DatasetCache(max_size=3)