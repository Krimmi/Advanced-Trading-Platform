"""
Security utilities for the Ultimate Hedge Fund & Trading Application.
"""
from passlib.context import CryptContext
import secrets
import string

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: The plain text password
        
    Returns:
        The hashed password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: The plain text password
        hashed_password: The hashed password
        
    Returns:
        True if the password matches the hash, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)

def generate_password_reset_token() -> str:
    """
    Generate a secure token for password reset.
    
    Returns:
        A secure random token
    """
    # Generate a 32-character random token
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def generate_verification_code() -> str:
    """
    Generate a numeric verification code.
    
    Returns:
        A 6-digit verification code
    """
    # Generate a 6-digit verification code
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def is_strong_password(password: str) -> bool:
    """
    Check if a password meets strength requirements.
    
    Args:
        password: The password to check
        
    Returns:
        True if the password is strong, False otherwise
    """
    # Password must be at least 8 characters long
    if len(password) < 8:
        return False
    
    # Password must contain at least one uppercase letter
    if not any(c.isupper() for c in password):
        return False
    
    # Password must contain at least one lowercase letter
    if not any(c.islower() for c in password):
        return False
    
    # Password must contain at least one digit
    if not any(c.isdigit() for c in password):
        return False
    
    # Password must contain at least one special character
    special_chars = "!@#$%^&*()-_=+[]{}|;:,.<>?/~`"
    if not any(c in special_chars for c in password):
        return False
    
    return True