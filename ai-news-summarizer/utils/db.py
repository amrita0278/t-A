from pymongo import MongoClient
from flask import g
import os

def get_db():
    """Get database connection from context"""
    if 'db' not in g:
        g.db = MongoClient(os.getenv('MONGODB_URI')).news_db
    return g.db

def init_db(app):
    """Initialize database connection"""
    with app.app_context():
        db = get_db()
        # Create indexes
        db.users.create_index('email', unique=True)
        db.users.create_index('username', unique=True)
        
        print("Database initialized successfully")

def close_db(e=None):
    """Close database connection"""
    db = g.pop('db', None)
    if db is not None:
        db.client.close()