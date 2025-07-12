"""
TEST MATRIX for Profile initialization and behavior:

| Init Method      | max_calls | on_violation_max_calls | on_violation_duplicate_call | Description / Expected Behavior                        |
|------------------|-----------|------------------------|-----------------------------|--------------------------------------------------------|
| kwargs           | 2         | raise                  | default                     | Raises on 3rd call, no duplicate detection             |
| kwargs           | 1         | warn                   | default                     | Warns on 2nd call, no duplicate detection              |
| kwargs           | default   | default                | raise                       | No max limit; raises on 2nd duplicate                  |
| kwargs           | default   | default                | warn                        | No max limit; warns on 2nd duplicate                   |
| dict config      | 3         | warn                   | warn                        | Warns on 4th call and on 2nd duplicate                 |
| JSON file config | 2         | raise                  | warn                        | Raises on 3rd call; warns on 2nd duplicate             |
| YAML file config | 0         | raise                  | raise                       | Zero calls allowed; raises on 1st call and 2nd dup     |
"""

import pytest
import logging
import json
import yaml
from pathlib import Path
from gardefou.profile import Profile, QuotaExceededError

# 1. Max-calls enforcement (raise)
def test_max_calls_raises():
    p = Profile(max_calls=2, on_violation_max_calls="raise")
    # first two calls OK
    p.check("foo", (), {})
    p.check("foo", (), {})
    # third call should raise
    with pytest.raises(QuotaExceededError):
        p.check("foo", (), {})

# 2. Max-calls enforcement (warn)
def test_max_calls_warns(caplog):
    caplog.set_level(logging.WARNING)
    p = Profile(max_calls=1, on_violation_max_calls="warn")
    p.check("foo", (), {})       # 1st call OK
    p.check("foo", (), {})       # 2nd “over” triggers warning
    assert "call quota exceeded" in caplog.text

# 3. Duplicate-call detection (raise)
def test_duplicate_raises():
    p = Profile(on_violation_duplicate_call="raise")
    # first call signature is recorded
    p.check("bar", (1,), {"x": 2})
    # second identical call should raise
    with pytest.raises(QuotaExceededError):
        p.check("bar", (1,), {"x": 2})

# 4. Duplicate-call detection (warn)
def test_duplicate_warns(caplog):
    caplog.set_level(logging.WARNING)
    p = Profile(on_violation_duplicate_call="warn")
    p.check("bar", ("a",), {})
    p.check("bar", ("a",), {})
    assert "duplicate call detected" in caplog.text

# 5. Custom callback
def test_custom_callback(monkeypatch):
    called = {}
    def cb(profile):
        called['fired'] = True
        # you could inspect profile.call_count or profile._call_signatures here

    p = Profile(max_calls=1, on_violation_max_calls=cb)
    # first is fine
    p.check("foo", (), {})
    # second triggers our cb
    p.check("foo", (), {})
    assert called.get('fired', False) is True
    


# Additional scenario coverage from the matrix
def test_dict_config_both_warn(tmp_path, caplog):
    caplog.set_level(logging.WARNING)
    cfg = {"max_calls": 3, "on_violation_max_calls": "warn", "on_violation_duplicate_call": "warn"}
    p = Profile(config=cfg)
    # max_calls warn on 4th call
    for _ in range(3):
        p.check("fn", (), {})
    p.check("fn", (), {})
    assert "call quota exceeded" in caplog.text
    # duplicate warn on second duplicate
    caplog.clear()
    p = Profile(config=cfg)
    p.check("fn", (1,), {})
    p.check("fn", (1,), {})
    assert "duplicate call detected" in caplog.text

def test_json_file_config(tmp_path, caplog):
    data = {"max_calls": 2, "on_violation_max_calls": "raise", "on_violation_duplicate_call": "warn"}
    file = tmp_path / "profile.json"
    file.write_text(json.dumps(data))
    p = Profile(config=str(file))
    # 3rd call raises
    p.check("f", (), {})
    p.check("f", (), {})
    with pytest.raises(QuotaExceededError):
        p.check("f", (), {})
    # duplicate warn on second duplicate
    p = Profile(config=str(file))
    caplog.clear()
    caplog.set_level(logging.WARNING)
    p.check("f", (), {})
    p.check("f", (), {})
    assert "duplicate call detected" in caplog.text

def test_yaml_file_config(tmp_path):
    data = {"max_calls": 0, "on_violation_max_calls": "raise", "on_violation_duplicate_call": "raise"}
    file = tmp_path / "profile.yaml"
    file.write_text(yaml.safe_dump(data))
    p = Profile(config=str(file))
    # zero calls allowed, immediate raise on first
    with pytest.raises(QuotaExceededError):
        p.check("x", (), {})
    # duplicate raise on second duplicate (if first somehow passed)
    with pytest.raises(QuotaExceededError):
        p.check("x", (), {})

def test_no_limit_by_default():
    p = Profile()
    for i in range(100):
        p.check("any", (i,), {})
    # no exception should be raised

def test_explicit_zero_max_calls():
    p = Profile(max_calls=0, on_violation_max_calls="raise")
    with pytest.raises(QuotaExceededError):
        p.check("z", (), {})    