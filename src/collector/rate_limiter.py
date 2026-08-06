import time
import threading

class RateLimiter:
    """
    Enforces a strict minimum time interval between consecutive executions/requests.
    Prevents triggering Liquipedia API rate limits.
    """
    def __init__(self, min_interval: float = 2.5):
        self.min_interval = min_interval
        self.last_call_timestamp = 0.0
        self._lock = threading.Lock()

    def wait(self):
        """
        Blocks the calling thread until min_interval seconds have elapsed since last call.
        """
        with self._lock:
            now = time.time()
            elapsed = now - self.last_call_timestamp
            if elapsed < self.min_interval:
                sleep_duration = self.min_interval - elapsed
                time.sleep(sleep_duration)
            self.last_call_timestamp = time.time()
