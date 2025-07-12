"""
TEST MATRIX for GardeFou wrapper:

| Scenario                         | init args                                     | Expected Behavior                             |
|----------------------------------|-----------------------------------------------|-----------------------------------------------|
| Sync default (no args)           | GardeFou()                                    | Unlimited calls, no errors                    |
| Sync with max_calls raise        | GardeFou(max_calls=1, on_violation="raise")   | 1st ok, 2nd raises                            |
| Sync with max_calls warn         | GardeFou(max_calls=1, on_violation="warn")    | 1st ok, 2nd logs warning and returns result   |
| Sync duplicate warn              | GardeFou(on_violation_duplicate_call="warn")  | 2 identical calls, 2nd logs warning           |
| Sync duplicate raise             | GardeFou(on_violation_duplicate_call="raise") | 2 identical calls, 2nd raises                 |
| Async default                    | GardeFou()                                    | Unlimited async calls                         |
| Async quota raise                | GardeFou(max_calls=1, on_violation="raise")   | 1st ok, 2nd raises                            |
| Async duplicate raise            | GardeFou(on_violation_duplicate_call="raise") | 2 identical async calls, 2nd raises           |
| Profile pass-through             | guard = GardeFou(profile=Profile(max_calls=1))| uses provided Profile                        |
| Custom callback                  | GardeFou(on_violation="callback")             | invokes callback on breach                    |
"""

import logging

import pytest
from gardefou import GardeFou, Profile, QuotaExceededError

# A dummy sync function to wrap
def add(a, b):
    return a + b

# A dummy async function
async def mul(a, b):
    return a * b

def test_guarded_sync_success():
    """
    Sync: max_calls=2, default raise on excess.
    """
    guard = GardeFou(max_calls=2)
    assert guard(add, 1, 2) == 3
    assert guard(add, 3, 4) == 7

def test_guarded_sync_quota_exceeded():
    """
    Sync: max_calls=1, raise on quota exceeded.
    """
    guard = GardeFou(max_calls=1, on_violation="raise")
    assert guard(add, 1, 2) == 3
    with pytest.raises(QuotaExceededError):
        guard(add, 5, 6)

@pytest.mark.asyncio
async def test_guarded_async_success():
    """
    Async: max_calls=2, default raise on excess.
    """
    guard = GardeFou(max_calls=2)
    r1 = await guard(mul, 2, 3)
    r2 = await guard(mul, 3, 4)
    assert (r1, r2) == (6, 12)

@pytest.mark.asyncio
async def test_guarded_async_duplicate():
    """
    Async: duplicate detection with raise.
    """
    guard = GardeFou(max_calls=10, on_violation_duplicate_call="raise")
    res1 = await guard(mul, 2, 2)
    with pytest.raises(QuotaExceededError):
        await guard(mul, 2, 2)

def test_profile_passed_through():
    """
    Passing a Profile object is honored by GardeFou.
    """
    p = Profile(max_calls=1)
    guard = GardeFou(profile=p)
    assert guard(add, 1, 1) == 2
    with pytest.raises(QuotaExceededError):
        guard(add, 0, 0)


def test_guarded_sync_default_no_limit():
    """
    By default, GardeFou() allows unlimited sync calls.
    """
    guard = GardeFou()
    assert guard(add, 1, 1) == 2
    for i in range(5):
        assert guard(add, i, i) == i + i

def test_guarded_sync_max_warn(caplog):
    """
    GardeFou with max_calls=1 and warn should log a warning on the 2nd call.
    """
    caplog.set_level(logging.WARNING)
    guard = GardeFou(max_calls=1, on_violation="warn")
    assert guard(add, 2, 3) == 5
    # second exceeds; should warn but return result
    res = guard(add, 4, 5)
    assert res == 9
    assert "call quota exceeded" in caplog.text

def test_guarded_sync_duplicate_warn(caplog):
    """
    Duplicate detection warn only if enabled.
    """
    caplog.set_level(logging.WARNING)
    guard = GardeFou(on_violation_duplicate_call="warn")
    assert guard(add, 7, 8) == 15
    # duplicate
    res = guard(add, 7, 8)
    assert res == 15
    assert "duplicate call detected" in caplog.text

def test_guarded_sync_duplicate_raise():
    """
    Duplicate detection raise only if enabled.
    """
    guard = GardeFou(on_violation_duplicate_call="raise")
    assert guard(add, 1, 2) == 3
    with pytest.raises(QuotaExceededError):
        guard(add, 1, 2)

@pytest.mark.asyncio
async def test_guarded_async_default_no_limit():
    """
    By default, GardeFou() allows unlimited async calls.
    """
    guard = GardeFou()
    for i in range(5):
        assert await guard(mul, i, i) == i * i

@pytest.mark.asyncio
async def test_guarded_async_max_raise():
    """
    Async max_calls raise on 2nd call.
    """
    guard = GardeFou(max_calls=1, on_violation="raise")
    assert await guard(mul, 3, 4) == 12
    with pytest.raises(QuotaExceededError):
        await guard(mul, 5, 6)

def test_guarded_custom_profile_object():
    """
    Passing in a Profile object should be honored.
    """
    p = Profile(max_calls=1, on_violation="raise")
    guard = GardeFou(profile=p)
    assert guard(add, 9, 1) == 10
    with pytest.raises(QuotaExceededError):
        guard(add, 0, 0)

def test_guarded_custom_callback(monkeypatch):
    """
    GardeFou should call a user callback on violation.
    """
    called = {}
    def cb(profile):
        called['ok'] = True

    guard = GardeFou(max_calls=1, on_violation_max_calls=cb)
    assert guard(add, 1, 1) == 2
    guard(add, 2, 2)  # second triggers callback
    assert called.get('ok') is True