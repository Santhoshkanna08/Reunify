"""
REUNIFY Scoring Configuration
Centralizes all deterministic verification point weights.
NEVER scatter scoring weights across codebase files.
"""

# Scoring weights (Points)
ID_MATCH_POINTS = 30
AGE_COMPAT_POINTS = 15          # Within ±2 years
DISTRICT_MATCH_POINTS = 15      # Same administrative district
TIME_COMPAT_POINTS = 10         # Chronologically feasible (record at/after last seen)
CLOTHING_MATCH_POINTS = 10      # Clothing color/garment token match
MARKS_MATCH_POINTS = 15         # Distinguishing anatomical scar/mark match
NAME_SIMILARITY_MAX_POINTS = 20 # Scaled by similarity ratio (up to +20)

# Penalties
CONTRADICTION_PENALTY = -25

# Unknown/missing data default
UNKNOWN_FIELD_POINTS = 0
