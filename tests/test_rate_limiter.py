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
    # 2 intervals of 0.2s should take >= 0.4s
    assert elapsed >= 0.38
