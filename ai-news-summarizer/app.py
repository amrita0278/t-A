from flask import Flask, render_template, session
from config import config
import os
from utils.db import init_db

def create_app(config_name='default'):
    """Application factory function"""
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize MongoDB
    init_db(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.news import news_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(news_bp)
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return render_template('404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return render_template('500.html'), 500
    
    # Root route
    @app.route('/')
    def index():
        """Landing page"""
        return render_template('index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)