import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union, Set

import yaml  # ensure pyyaml is listed as a dependency

class QuotaExceededError(Exception):
    """Raised when the call quota is exceeded."""

class Profile:
    """
    Holds all quota and rule settings.

    Users can initialize this in three ways:
      1) Pass `config` as a dict of settings
      2) Pass `config` as a path to a YAML/JSON file
      3) Pass keyword args directly for common options

    Scenario-specific callbacks override the generic on_violation setting:
      - on_violation_max_calls
      - on_violation_duplicate_call
    """

    def __init__(
        self,
        *,
        config: Optional[Union[str, Path, Dict[str, Any]]] = None,
        max_calls: Optional[int] = None,
        on_violation: Optional[Union[str, callable]] = None,
        on_violation_max_calls: Optional[Union[str, callable]] = None,
        on_violation_duplicate_call: Optional[Union[str, callable]] = None,
    ):
        # 1) Load base data from file if config is a path
        data: Dict[str, Any] = {}
        if isinstance(config, (str, Path)):
            path = Path(config)
            text = path.read_text()
            if path.suffix in (".yaml", ".yml"):
                data = yaml.safe_load(text)
            else:
                data = json.loads(text)
        # 2) Load base data directly if config is a dict
        elif isinstance(config, dict):
            data = config.copy()

        # 3) Override with explicit kwargs
        if max_calls is not None:
            data["max_calls"] = max_calls
        if on_violation is not None:
            data["on_violation"] = on_violation
        if on_violation_max_calls is not None:
            data["on_violation_max_calls"] = on_violation_max_calls
        if on_violation_duplicate_call is not None:
            data["on_violation_duplicate_call"] = on_violation_duplicate_call

        # 4) Assign settings with defaults
        # default max_calls to -1 (no limit) when not set; allow explicit 0
        self.max_calls = data.get("max_calls", -1)
        self.on_violation = data.get("on_violation", "raise")
        self.on_violation_max_calls = data.get("on_violation_max_calls", self.on_violation)
        self.on_violation_duplicate_call = data.get("on_violation_duplicate_call", self.on_violation)

        self.call_count = 0
        self._call_signatures: Set[Any] = set()

        # Track which rules were explicitly configured
        self._max_calls_enabled = "max_calls" in data and self.max_calls >= 0
        self._dup_enabled = "on_violation_duplicate_call" in data


    def check(self, fn_name: Optional[str] = None, args: tuple = (), kwargs: Optional[Dict[str, Any]] = None):
        """
        Enforce configured rules for the given call.

        This method is idempotent and will not raise any exceptions directly.
        Instead, it will invoke the configured handler functions
        (on_violation_max_calls and/or on_violation_duplicate_call) when a rule
        is breached.

        Args:
            fn_name: str, name of the function being called
            args: tuple, positional arguments being passed
            kwargs: dict, keyword arguments being passed
        """
        if self._max_calls_enabled:
            # no extra context needed
            self._check_max_call()
        if self._dup_enabled:
            # needs to know exactly which call to compare
            self._check_duplicate(fn_name, args, kwargs)


    def _check_max_call(self):
        """
        Increment call count and enforce the max_calls quota.
        Uses on_violation_max_calls handler when quota is breached.
        """
        self.call_count += 1
        if self.call_count > self.max_calls:
            msg = f"GardeFou: call quota exceeded ({self.call_count}/{self.max_calls})"
            handler = self.on_violation_max_calls
            if handler == "warn":
                logging.warning(msg)
            elif handler == "raise":
                raise QuotaExceededError(msg)
            elif callable(handler):
                handler(self)

    def _check_duplicate(self, fn_name: Optional[str] = None, args: tuple = (), kwargs: Optional[Dict[str, Any]] = None):
        """
        Detect duplicate calls (same function name and parameters).
        Uses on_violation_duplicate_call handler when a duplicate is detected.
        """
        # Create a simple signature key
        sig = (fn_name, repr(args), repr(sorted(kwargs.items())))
        if sig in self._call_signatures:
            msg = f"GardeFou: duplicate call detected for {fn_name} with args {args} and kwargs {kwargs}"
            handler = self.on_violation_duplicate_call
            if handler == "warn":
                logging.warning(msg)
            elif handler == "raise":
                raise QuotaExceededError(msg)
            elif callable(handler):
                handler(self)
        else:
            self._call_signatures.add(sig)