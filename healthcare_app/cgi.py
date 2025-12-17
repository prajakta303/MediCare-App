"""Compatibility shim for removed stdlib `cgi` module (Python 3.13).
This implements a minimal `parse_header` function used by Django's
`django.http.request` to parse Content-Type header parameters.

This file lives in the project root so Python's import system will
pick it up before the missing stdlib module.
"""
from typing import Tuple, Dict


def parse_header(line: str) -> Tuple[str, Dict[str, str]]:
    """Parse a Content-Type like header into (value, params dict).

    Example:
        >>> parse_header('text/plain; charset="utf-8"')
        ('text/plain', {'charset': 'utf-8'})
    """
    if not line:
        return '', {}

    parts = [p.strip() for p in line.split(';')]
    value = parts[0]
    params = {}
    for param in parts[1:]:
        if not param:
            continue
        if '=' in param:
            name, val = param.split('=', 1)
            name = name.strip().lower()
            val = val.strip()
            if len(val) >= 2 and ((val[0] == val[-1]) and val[0] in ('"', "'")):
                val = val[1:-1]
            params[name] = val
        else:
            # Parameter without '=', treat as a flag with empty value
            params[param.lower()] = ''
    return value, params
