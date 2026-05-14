import json
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from backend.db import SessionLocal
from backend.Ai_housing.property_match import match_properties

def test_model():
    print("Initializing Database Session...")
    db = SessionLocal()
    
    try:
        user_profile = {
            "budget": 600.0,
            "city": "tunis",
            "rooms_needed": 2,
            "sleep_schedule": "flexible",
            "cleanliness": "moderate",
            "social_life": "moderate",
            "work_style": "hybrid"
        }
        
        print(f"Testing with User Profile:")
        print(json.dumps(user_profile, indent=2))
        
        print("\n=== FINDING TOP 3 MATCHES (NO FILTER) ===")
        results = match_properties(db, user_profile, filter_by=None, top_n=3)
        
        if not results:
            print("No matching properties found in database.")
            return

        for i, match in enumerate(results, 1):
            print(f"\nMatch #{i}: {match['title']} (City: {match['city']}, Price: {match['price']})")
            print(f"  Overall Score: {match['score']}% (Weighted: {match['weighted']}%, Cosine: {match['cosine']}%)")
            print(f"  Budget Score details: {match['score_details']['budget']}%")
            print(f"  Location Score details: {match['score_details']['location']}%")
            print(f"  Rooms Score details: {match['score_details']['rooms']}%")
            print(f"  Lifestyle Score details: {match['score_details']['lifestyle']}%")
            print("  Explanation:")
            for exp in match['explanation']:
                print(f"    - {exp}")
                
        print("\n=== TEST WITH 'BUDGET' FILTER ===")
        results_budget = match_properties(db, user_profile, filter_by="budget", top_n=2)
        for i, match in enumerate(results_budget, 1):
            print(f"\nBudget Match #{i}: {match['title']} (Price: {match['price']}, Score details: {match['score_details']['budget']}%)")

    
    except Exception as e:
        print(f"Error testing model: {e}")
    finally:
        db.close()
        print("\nTest finished.")

if __name__ == "__main__":
    test_model()
