import time
import pytest
from src.collector.rate_limiter import RateLimiter
def test_rate_limiter_delay():
    limiter = RateLimiter(min_interval=0.2)
    start = time.time()
    limiter.wait()
    limiter.wait()
    limiter.wait()
    elapsed = time.time() - start
    assert elapsed >= 0.38
