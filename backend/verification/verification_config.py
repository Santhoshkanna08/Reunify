"""
REUNIFY Verification & Feasibility Configuration
"""

# Maximum plausible human transit velocity under emergency/flood disaster terrain.
# This is a prototype heuristic, not a universal physical threshold.
MAX_PLAUSIBLE_SPEED_KMH = 60.0

# Minimum time difference in minutes required to assess velocity (avoids division by zero)
MIN_EVAL_TIME_DIFF_MINUTES = 2.0
