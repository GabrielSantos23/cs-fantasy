import logging
from typing import Dict, List, Any
from src.config import PLACEMENT_POINTS, DEFAULT_PLACEMENT_POINTS, TIER_MULTIPLIERS, DEFAULT_TIER_MULTIPLIER
logger = logging.getLogger(__name__)
class EraScorer:
    """
    Calculates scores for individual tournaments and aggregates era performance.
    """
    @staticmethod
    def calculate_tournament_score(placement: str, tier: str) -> float:
        """
        Calculates points earned from a single tournament placement and tier.
        """
        base_points = PLACEMENT_POINTS.get(placement, DEFAULT_PLACEMENT_POINTS)
        multiplier = TIER_MULTIPLIERS.get(tier, DEFAULT_TIER_MULTIPLIER)
        return round(base_points * multiplier, 2)
    @classmethod
    def score_era(cls, era_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates era scores, team breakdowns, and detailed tournament scores for a given era structure.
        """
        appearances = era_data.get("appearances", [])
        total_score = 0.0
        team_breakdown: Dict[str, Dict[str, Any]] = {}
        tournaments_breakdown = []
        for app in appearances:
            placement = app.get("placement", "9-12")
            tier = app.get("tournament_tier", "A-Tier")
            team_name = app.get("team_name", "Unknown")
            tournament_name = app.get("tournament_name", app.get("tournament_id"))
            score = cls.calculate_tournament_score(placement, tier)
            total_score += score
            if team_name not in team_breakdown:
                team_breakdown[team_name] = {
                    "tournaments": 0,
                    "score": 0.0,
                    "placements": []
                }
            team_breakdown[team_name]["tournaments"] += 1
            team_breakdown[team_name]["score"] = round(team_breakdown[team_name]["score"] + score, 2)
            team_breakdown[team_name]["placements"].append(placement)
            tournaments_breakdown.append({
                "tournament_id": app.get("tournament_id"),
                "tournament_name": tournament_name,
                "tier": tier,
                "team": team_name,
                "role": app.get("role"),
                "placement": placement,
                "score": score
            })
        count = len(appearances)
        avg_score = round(total_score / count, 2) if count > 0 else 0.0
        total_score = round(total_score, 2)
        return {
            "player_id": era_data["player_id"],
            "year": era_data["year"],
            "total_score": total_score,
            "average_score": avg_score,
            "tournaments_count": count,
            "teams": era_data.get("teams", []),
            "roles": era_data.get("roles", []),
            "breakdown": {
                "team_summary": team_breakdown,
                "tournaments": tournaments_breakdown
            }
        }
