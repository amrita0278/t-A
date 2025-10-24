from flask import Blueprint, render_template, request, redirect, url_for, flash, session, make_response
from models.user import User
import re

auth_bp = Blueprint('auth', __name__)

def login_required(f):
    """Decorator to require login for routes"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page.', 'error')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def no_cache(view):
    """Decorator to prevent caching of pages"""
    from functools import wraps
    @wraps(view)
    def no_cache_impl(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    return no_cache_impl

@auth_bp.route('/login', methods=['GET', 'POST'])
@no_cache
def login():
    """Handle user login"""
    # If user is already logged in, redirect to dashboard
    if 'user_id' in session:
        flash('You are already logged in!', 'info')
        return redirect(url_for('news.dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        
        # Basic validation
        if not email or not password:
            flash('Please fill in all fields.', 'error')
            return render_template('login.html')
        
        # Find user by email
        user = User.find_by_email(email)
        if not user:
            flash('Invalid email or password.', 'error')
            return render_template('login.html')
        
        # Verify password
        if User.verify_password(user['password'], password):
            session['user_id'] = str(user['_id'])
            session['username'] = user['username']
            session['email'] = user['email']
            
            flash(f'Welcome back, {user["username"]}!', 'success')
            return redirect(url_for('news.dashboard'))
        else:
            flash('Invalid email or password.', 'error')
    
    return render_template('login.html')

@auth_bp.route('/register', methods=['GET', 'POST'])
@no_cache
def register():
    """Handle user registration"""
    # If user is already logged in, redirect to dashboard
    if 'user_id' in session:
        flash('You are already logged in!', 'info')
        return redirect(url_for('news.dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Validation
        if not all([username, email, password, confirm_password]):
            flash('Please fill in all fields.', 'error')
            return render_template('register.html')
        
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')
        
        if len(password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('register.html')
        
        # Email validation
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            flash('Please enter a valid email address.', 'error')
            return render_template('register.html')
        
        # Create user
        user, error = User.create_user(username, email, password)
        if error:
            flash(error, 'error')
            return render_template('register.html')
        
        # AUTO-LOGIN: Create session for the new user
        session['user_id'] = str(user['_id'])
        session['username'] = user['username']
        session['email'] = user['email']
        
        flash(f'Account created successfully! Welcome, {user["username"]}!', 'success')
        return redirect(url_for('news.dashboard'))
    
    return render_template('register.html')

@auth_bp.route('/logout')
@no_cache
def logout():
    """Handle user logout - Clear session completely"""
    session.clear()
    
    # Additional headers to prevent caching
    response = make_response(redirect(url_for('auth.login')))
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    
    flash('You have been logged out successfully.', 'success')
    return response