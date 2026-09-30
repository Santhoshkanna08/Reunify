"""
REUNIFY Allowlisted Tool Dispatcher
Strictly restricts tool execution to verified allowlisted actions.
"""

from typing import Dict, Any, List
from .shelter import search_shelter
from .hospital import search_hospital
from .helpline import search_helpline
from ..schemas.agent import ALLOWLISTED_ACTIONS


def dispatch_tool(action: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes allowlisted action with given parameters.
    Rejects any unapproved action.
    """
    if action not in ALLOWLISTED_ACTIONS:
        raise ValueError(f"Action '{action}' is not in the allowlist: {ALLOWLISTED_ACTIONS}")

    if action == "search_shelter":
        records = search_shelter(**parameters)
        return {
            "status": "success",
            "action": action,
            "records": records,
            "count": len(records),
        }

    if action == "search_hospital":
        records = search_hospital(**parameters)
        return {
            "status": "success",
            "action": action,
            "records": records,
            "count": len(records),
        }

    if action == "search_helpline":
        records = search_helpline(**parameters)
        return {
            "status": "success",
            "action": action,
            "records": records,
            "count": len(records),
        }

    if action in ("review_candidate", "finish_investigation"):
        return {
            "status": "success",
            "action": action,
            "records": [],
            "count": 0,
            "message": f"Action {action} dispatched to supervisory desk.",
        }

    raise ValueError(f"Unhandled allowlisted action: {action}")
