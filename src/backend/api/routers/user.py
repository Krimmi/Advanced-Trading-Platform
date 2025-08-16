"""
Router for user management endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Body, Query
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, EmailStr
import uuid
import json

router = APIRouter()

# --- Pydantic Models ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserPreferences(BaseModel):
    theme: Optional[str] = "light"
    default_dashboard: Optional[str] = "overview"
    notification_settings: Optional[Dict[str, bool]] = None
    chart_preferences: Optional[Dict[str, Any]] = None

# --- Mock Data ---

# Mock user data - will be replaced with database storage
mock_users = {
    "user1": {
        "id": "user1",
        "email": "user@example.com",
        "password_hash": "hashed_password",  # In a real app, this would be properly hashed
        "first_name": "John",
        "last_name": "Doe",
        "created_at": "2025-01-01T00:00:00Z",
        "last_login": "2025-08-10T10:30:00Z",
        "is_active": True,
        "preferences": {
            "theme": "dark",
            "default_dashboard": "portfolio",
            "notification_settings": {
                "email_alerts": True,
                "price_alerts": True,
                "news_alerts": True,
                "earnings_alerts": True
            },
            "chart_preferences": {
                "default_timeframe": "1d",
                "default_indicators": ["sma_20", "sma_50", "volume"]
            }
        },
        "watchlists": [
            {
                "id": "watchlist1",
                "name": "Tech Stocks",
                "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA"]
            },
            {
                "id": "watchlist2",
                "name": "Dividend Stocks",
                "symbols": ["JNJ", "PG", "KO", "VZ", "MCD"]
            }
        ]
    }
}

# --- Helper Functions ---

def get_current_user() -> Dict[str, Any]:
    """
    Mock function to get the current authenticated user.
    In a real app, this would verify the JWT token.
    """
    # For demonstration, always return the mock user
    return mock_users["user1"]

# --- Endpoints ---

@router.post("/login")
async def login(request: LoginRequest) -> Dict[str, Any]:
    """
    Login a user.
    """
    try:
        # In a real app, this would verify the credentials against the database
        # and generate a JWT token
        
        # For demonstration, check if the email matches our mock user
        user = None
        for user_id, user_data in mock_users.items():
            if user_data["email"] == request.email:
                user = user_data
                break
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # In a real app, we would verify the password hash
        # For demonstration, we'll just check if the password is "password"
        if request.password != "password":
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Update last login
        user["last_login"] = datetime.now().isoformat()
        
        # Generate a mock token
        token = "mock_jwt_token"
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error logging in: {str(e)}")

@router.post("/register")
async def register(user: UserCreate) -> Dict[str, Any]:
    """
    Register a new user.
    """
    try:
        # Check if email already exists
        for user_id, user_data in mock_users.items():
            if user_data["email"] == user.email:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Generate a new user ID
        user_id = f"user{len(mock_users) + 1}"
        
        # Create new user
        new_user = {
            "id": user_id,
            "email": user.email,
            "password_hash": "hashed_password",  # In a real app, this would be properly hashed
            "first_name": user.first_name,
            "last_name": user.last_name,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "is_active": True,
            "preferences": {
                "theme": "light",
                "default_dashboard": "overview",
                "notification_settings": {
                    "email_alerts": True,
                    "price_alerts": True,
                    "news_alerts": True,
                    "earnings_alerts": True
                },
                "chart_preferences": {
                    "default_timeframe": "1d",
                    "default_indicators": ["sma_20", "sma_50", "volume"]
                }
            },
            "watchlists": []
        }
        
        # Add to mock users
        mock_users[user_id] = new_user
        
        # Generate a mock token
        token = "mock_jwt_token"
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": new_user["id"],
                "email": new_user["email"],
                "first_name": new_user["first_name"],
                "last_name": new_user["last_name"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registering user: {str(e)}")

@router.get("/me")
async def get_current_user_info() -> Dict[str, Any]:
    """
    Get current user information.
    """
    try:
        user = get_current_user()
        
        return {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user info: {str(e)}")

@router.put("/me")
async def update_user_info(user_update: UserUpdate) -> Dict[str, Any]:
    """
    Update user information.
    """
    try:
        user = get_current_user()
        
        # Update fields
        if user_update.first_name:
            user["first_name"] = user_update.first_name
        
        if user_update.last_name:
            user["last_name"] = user_update.last_name
        
        if user_update.email:
            # Check if email already exists
            for user_id, user_data in mock_users.items():
                if user_id != user["id"] and user_data["email"] == user_update.email:
                    raise HTTPException(status_code=400, detail="Email already registered")
            
            user["email"] = user_update.email
        
        return {
            "id": user["id"],
            "email": user["email"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "created_at": user["created_at"],
            "last_login": user["last_login"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user info: {str(e)}")

@router.post("/change-password")
async def change_password(password_change: PasswordChange) -> Dict[str, Any]:
    """
    Change user password.
    """
    try:
        user = get_current_user()
        
        # In a real app, we would verify the current password hash
        # For demonstration, we'll just check if the current password is "password"
        if password_change.current_password != "password":
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password hash
        # In a real app, this would properly hash the new password
        user["password_hash"] = "new_hashed_password"
        
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing password: {str(e)}")

@router.get("/preferences")
async def get_user_preferences() -> Dict[str, Any]:
    """
    Get user preferences.
    """
    try:
        user = get_current_user()
        return user["preferences"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user preferences: {str(e)}")

@router.put("/preferences")
async def update_user_preferences(preferences: UserPreferences) -> Dict[str, Any]:
    """
    Update user preferences.
    """
    try:
        user = get_current_user()
        
        # Update preferences
        if preferences.theme:
            user["preferences"]["theme"] = preferences.theme
        
        if preferences.default_dashboard:
            user["preferences"]["default_dashboard"] = preferences.default_dashboard
        
        if preferences.notification_settings:
            user["preferences"]["notification_settings"].update(preferences.notification_settings)
        
        if preferences.chart_preferences:
            user["preferences"]["chart_preferences"].update(preferences.chart_preferences)
        
        return user["preferences"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user preferences: {str(e)}")

@router.get("/watchlists")
async def get_watchlists() -> List[Dict[str, Any]]:
    """
    Get user watchlists.
    """
    try:
        user = get_current_user()
        return user["watchlists"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting watchlists: {str(e)}")

@router.post("/watchlists")
async def create_watchlist(
    name: str = Body(...),
    symbols: List[str] = Body([])
) -> Dict[str, Any]:
    """
    Create a new watchlist.
    """
    try:
        user = get_current_user()
        
        # Generate watchlist ID
        watchlist_id = f"watchlist{len(user['watchlists']) + 1}"
        
        # Create watchlist
        watchlist = {
            "id": watchlist_id,
            "name": name,
            "symbols": symbols
        }
        
        # Add to user's watchlists
        user["watchlists"].append(watchlist)
        
        return watchlist
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating watchlist: {str(e)}")

@router.put("/watchlists/{watchlist_id}")
async def update_watchlist(
    watchlist_id: str,
    name: Optional[str] = Body(None),
    symbols: Optional[List[str]] = Body(None)
) -> Dict[str, Any]:
    """
    Update a watchlist.
    """
    try:
        user = get_current_user()
        
        # Find watchlist
        watchlist = None
        for wl in user["watchlists"]:
            if wl["id"] == watchlist_id:
                watchlist = wl
                break
        
        if not watchlist:
            raise HTTPException(status_code=404, detail=f"Watchlist not found: {watchlist_id}")
        
        # Update fields
        if name:
            watchlist["name"] = name
        
        if symbols is not None:
            watchlist["symbols"] = symbols
        
        return watchlist
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating watchlist: {str(e)}")

@router.delete("/watchlists/{watchlist_id}")
async def delete_watchlist(watchlist_id: str) -> Dict[str, Any]:
    """
    Delete a watchlist.
    """
    try:
        user = get_current_user()
        
        # Find watchlist index
        watchlist_index = None
        for i, wl in enumerate(user["watchlists"]):
            if wl["id"] == watchlist_id:
                watchlist_index = i
                break
        
        if watchlist_index is None:
            raise HTTPException(status_code=404, detail=f"Watchlist not found: {watchlist_id}")
        
        # Remove watchlist
        deleted_watchlist = user["watchlists"].pop(watchlist_index)
        
        return {
            "message": f"Watchlist {watchlist_id} deleted successfully",
            "deleted_watchlist": deleted_watchlist
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting watchlist: {str(e)}")

@router.post("/watchlists/{watchlist_id}/symbols")
async def add_symbol_to_watchlist(
    watchlist_id: str,
    symbol: str = Body(..., embed=True)
) -> Dict[str, Any]:
    """
    Add a symbol to a watchlist.
    """
    try:
        user = get_current_user()
        
        # Find watchlist
        watchlist = None
        for wl in user["watchlists"]:
            if wl["id"] == watchlist_id:
                watchlist = wl
                break
        
        if not watchlist:
            raise HTTPException(status_code=404, detail=f"Watchlist not found: {watchlist_id}")
        
        # Check if symbol already exists
        if symbol in watchlist["symbols"]:
            raise HTTPException(status_code=400, detail=f"Symbol {symbol} already in watchlist")
        
        # Add symbol
        watchlist["symbols"].append(symbol)
        
        return watchlist
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding symbol to watchlist: {str(e)}")

@router.delete("/watchlists/{watchlist_id}/symbols/{symbol}")
async def remove_symbol_from_watchlist(
    watchlist_id: str,
    symbol: str
) -> Dict[str, Any]:
    """
    Remove a symbol from a watchlist.
    """
    try:
        user = get_current_user()
        
        # Find watchlist
        watchlist = None
        for wl in user["watchlists"]:
            if wl["id"] == watchlist_id:
                watchlist = wl
                break
        
        if not watchlist:
            raise HTTPException(status_code=404, detail=f"Watchlist not found: {watchlist_id}")
        
        # Check if symbol exists
        if symbol not in watchlist["symbols"]:
            raise HTTPException(status_code=404, detail=f"Symbol {symbol} not in watchlist")
        
        # Remove symbol
        watchlist["symbols"].remove(symbol)
        
        return watchlist
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing symbol from watchlist: {str(e)}")