from pydantic import BaseModel

class ModerationAction(BaseModel):
    status: str