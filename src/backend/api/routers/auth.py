"""
Authentication router for the Ultimate Hedge Fund & Trading Application.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Dict, Any

# Import configuration
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))
from config.config import settings

# Import models and auth
from ...models.user import User
from ...auth.auth import authenticate_user, create_access_token, get_current_active_user
from ...config.database import get_db

# Create router
router = APIRouter()

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRATION)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRATION * 60,  # Convert to seconds
        "user_id": user.id,
        "username": user.username
    }

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """
    Get current user information.
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified
    }

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """
    Refresh access token.
    """
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRATION)
    access_token = create_access_token(
        data={"sub": current_user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRATION * 60  # Convert to seconds
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """
    Logout user.
    
    Note: JWT tokens cannot be invalidated, so this endpoint is mostly for client-side cleanup.
    For proper invalidation, implement a token blacklist using Redis.
    """
    return {"message": "Successfully logged out"}