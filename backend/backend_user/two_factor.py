"""Two-factor authentication (TOTP) endpoints.

This module supports:
- Setup: generate secret + QR (base64 image)
- Verify setup: confirm code and enable 2FA
- Disable: require a valid code, then disable 2FA
- Status: return whether 2FA is enabled

All endpoints require an authenticated user (Bearer token).
"""

import base64
import io

import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from .auth import get_current_user
from .models import User

router = APIRouter(prefix="/2fa", tags=["Two-Factor Auth"])


class TokenInput(BaseModel):
	token: str


def _generate_qr_base64(otpauth_url: str) -> str:
	img = qrcode.make(otpauth_url)
	buffer = io.BytesIO()
	img.save(buffer, format="PNG")
	return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")


@router.get("/status")
def status_2fa(current_user: User = Depends(get_current_user)):
	return {"two_factor_enabled": bool(getattr(current_user, "two_factor_enabled", False))}


@router.post("/setup")
def setup_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
	secret = pyotp.random_base32()
	totp = pyotp.TOTP(secret)

	issuer = "Roominder"
	otpauth_url = totp.provisioning_uri(name=current_user.email, issuer_name=issuer)

	current_user.two_factor_temp_secret = secret
	db.commit()

	return {"secret": secret, "qr_code": _generate_qr_base64(otpauth_url)}


@router.post("/verify-setup")
def verify_setup(body: TokenInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
	if not getattr(current_user, "two_factor_temp_secret", None):
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="No setup in progress. Call /2fa/setup first.",
		)

	totp = pyotp.TOTP(current_user.two_factor_temp_secret)
	if not totp.verify(body.token, valid_window=1):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code")

	current_user.two_factor_secret = current_user.two_factor_temp_secret
	current_user.two_factor_temp_secret = None
	current_user.two_factor_enabled = True
	db.commit()

	return {"success": True}


@router.post("/disable")
def disable_2fa(body: TokenInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
	if not getattr(current_user, "two_factor_enabled", False):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

	if not getattr(current_user, "two_factor_secret", None):
		raise HTTPException(
			status_code=status.HTTP_400_BAD_REQUEST,
			detail="2FA is enabled but no secret is configured",
		)

	totp = pyotp.TOTP(current_user.two_factor_secret)
	if not totp.verify(body.token, valid_window=1):
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid code")

	current_user.two_factor_secret = None
	current_user.two_factor_enabled = False
	db.commit()

	return {"success": True}
