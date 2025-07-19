"""Explicit callable guard for paid API calls."""
"""
USAGE:
    from gardefou import GardeFou, Profile

    # 1) Create a Profile object explicitly:
    profile = Profile(max_calls=5, on_violation="warn", on_violation_duplicate_call="warn")
    guard = GardeFou(profile=profile)

    # 2) Or pass Profile kwargs directly to GardeFou:
    guard = GardeFou(max_calls=10, on_violation_max_calls="raise", on_violation_duplicate_call="warn")

    # 3) For async calls:
    async_result = await guard(llm.agenerate, prompt)
    
    # 4) For synchronous calls:
    your code had this:
        result = llm.generate(prompt)
    now it should be:
        result = guard(llm.generate, prompt)

Only calls wrapped by guard(...) are checked against the profile you set in place.
"""


import inspect
from .profile import Profile

class GardeFou:
    """
    Callable guard that wraps explicit paid-API calls.

    You can initialize with:
      - An existing Profile: GardeFou(profile=Profile(...))
      - Any Profile kwargs:    GardeFou(max_calls=5, on_violation="warn", ...)
    """

    def __init__(self, *, profile: Profile = None, **profile_kwargs):
        if profile is not None:
            self._profile = profile
        else:
            # Delegate all config to Profile
            self._profile = Profile(**profile_kwargs)

    def __call__(self, fn, *args, **kwargs):
        """
        Enforce configured rules, then dispatch to the real function.
        
        This will run any enabled checks (max_calls, duplicate detection)
        via Profile.check(), then call the provided function (sync or async).
        """
        # Run the profile’s checks, providing context for duplicate detection
        self._profile.check(fn.__name__, args, kwargs)

        # Delegate to the real call
        if inspect.iscoroutinefunction(fn):
            return fn(*args, **kwargs)
        return fn(*args, **kwargs)