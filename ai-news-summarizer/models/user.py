from flask_bcrypt import Bcrypt
from utils.db import get_db
from bson.objectid import ObjectId
import datetime

bcrypt = Bcrypt()

class User:
    """User model for MongoDB"""
    
    @staticmethod
    def create_user(username, email, password):
        """Create a new user with hashed password"""
        db = get_db()
        users = db.users
        
        # Check if user already exists
        if users.find_one({'email': email}):
            return None, "Email already registered"
        
        if users.find_one({'username': username}):
            return None, "Username already taken"
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create user document
        user = {
            'username': username,
            'email': email,
            'password': hashed_password,
            'created_at': datetime.datetime.utcnow(),
            'preferences': {
                'categories': ['general', 'technology'],
                'country': 'us'
            }
        }
        
        # Insert user
        result = users.insert_one(user)
        user['_id'] = result.inserted_id
        
        return user, None
    
    @staticmethod
    def find_by_email(email):
        """Find user by email"""
        db = get_db()
        return db.users.find_one({'email': email})
    
    @staticmethod
    def verify_password(stored_password, provided_password):
        """Verify password against stored hash"""
        return bcrypt.check_password_hash(stored_password, provided_password)
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        db = get_db()
        return db.users.find_one({'_id': ObjectId(user_id)})