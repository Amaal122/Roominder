from sqlalchemy.orm import Session
from ..models import User
from ..db import SessionLocal


# ----------------------------
# USER VERIFICATION LOGIC
# ----------------------------
def auto_verify_user(user_id: int):
    """
    Background task:
    - checks user after registration
    - updates status based on rules
    """

    db: Session = SessionLocal()

    try:
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            return

        # only process pending users
        if user.status != "pending":
            return

        # 🔥 simple rule (you can replace with AI scoring later)
        if user.risk_score and user.risk_score >= 40:
            user.status = "approved"
        else:
            user.status = "manual_review"

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"[Verification Error] {e}")

    finally:
        db.close()