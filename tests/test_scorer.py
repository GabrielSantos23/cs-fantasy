import pytest
from src.processor.scorer import EraScorer

def test_calculate_tournament_score():
    # Major Champion: 100 * 2.5 = 250
    score_major_win = EraScorer.calculate_tournament_score("1", "Major")
    assert score_major_win == 250.0

    # S-Tier Runner up: 70 * 2.0 = 140
    score_stier_runnerup = EraScorer.calculate_tournament_score("2nd", "S-Tier")
    assert score_stier_runnerup == 140.0

    # A-Tier Top 4: 50 * 1.2 = 60
    score_atier_top4 = EraScorer.calculate_tournament_score("3-4", "A-Tier")
    assert score_atier_top4 == 60.0

def test_score_era_multi_team():
    era_input = {
        "player_id": "coldzera",
        "year": 2018,
        "teams": ["MIBR", "SK Gaming"],
        "roles": ["Rifler"],
        "appearances": [
            {
                "tournament_id": "iem_katowice_2018",
                "tournament_name": "IEM Katowice 2018",
                "tournament_tier": "S-Tier",
                "team_name": "SK Gaming",
                "role": "Rifler",
                "placement": "5-6"
            },
            {
                "tournament_id": "faceit_major_london_2018",
                "tournament_name": "FACEIT Major 2018",
                "tournament_tier": "Major",
                "team_name": "MIBR",
                "role": "Rifler",
                "placement": "3-4"
            }
        ]
    }

    result = EraScorer.score_era(era_input)

    assert result["player_id"] == "coldzera"
    assert result["year"] == 2018
    assert result["tournaments_count"] == 2
    
    # IEM Katowice 2018 (SK Gaming): 5-6 (30 pts) * S-Tier (2.0) = 60 pts
    # FACEIT Major 2018 (MIBR): 3-4 (50 pts) * Major (2.5) = 125 pts
    # Total = 185 pts, Avg = 92.5 pts
    assert result["total_score"] == 185.0
    assert result["average_score"] == 92.5
    
    # Verify breakdown per team
    team_summary = result["breakdown"]["team_summary"]
    assert "SK Gaming" in team_summary
    assert "MIBR" in team_summary
    assert team_summary["SK Gaming"]["score"] == 60.0
    assert team_summary["MIBR"]["score"] == 125.0
