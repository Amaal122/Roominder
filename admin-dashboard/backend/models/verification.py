from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base
# services/verification.py



class UserVerification(Base):

    __tablename__ = "user_verifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    trust_score = Column(Integer, default=0)

    verification_status = Column(String, default="pending")

    risk_level = Column(String, default="low")

    ip_address = Column(Text)

    verification_reason = Column(Text)
    