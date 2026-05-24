
from fastapi import APIRouter, Request
from sqlalchemy.orm import Session
from ..services.scoring import calculate_score
from fastapi import BackgroundTasks
from ..services.verification import auto_verify_user


router = APIRouter()

@router.post("/register")
async def register(data: dict, request: Request, background_tasks: BackgroundTasks):

    ip = request.client.host

    device_exists = False

    score, status = calculate_score(device_exists, ip)

    # create user
    # create verification
    # create device

    return {
        "message": "created",
        "score": score,
        "status": status
    }