from flask import Blueprint, render_template, request, jsonify, session, make_response
from routes.auth import login_required, no_cache
from utils.news_fetcher import NewsFetcher
from utils.gemini_ai import GeminiAI
import logging

news_bp = Blueprint('news', __name__)
news_fetcher = NewsFetcher()
gemini_ai = GeminiAI()

# Available categories
CATEGORIES = [
    'general', 'technology', 'business', 'sports', 
    'entertainment', 'health', 'science', 'politics', 'world', 'local'
]

@news_bp.route('/dashboard')
@login_required
@no_cache
def dashboard():
    """Main news dashboard"""
    category = request.args.get('category', 'general')
    
    # Validate category
    if category not in CATEGORIES:
        category = 'general'
    
    return render_template('dashboard.html', 
                         username=session.get('username'),
                         categories=CATEGORIES,
                         current_category=category)

@news_bp.route('/news/<category>')
@login_required
@no_cache
def get_news_by_category(category):
    """Fetch news by category (AJAX endpoint)"""
    try:
        # Validate category
        if category not in CATEGORIES:
            return jsonify({'error': 'Invalid category'}), 400
        
        # Fetch news articles
        articles = news_fetcher.fetch_top_headlines(category=category, page_size=8)
        
        # Enhance articles with AI summaries and sentiment
        enhanced_articles = []
        for article in articles:
            try:
                # Get content for AI processing
                content = article.get('content') or article.get('description') or article.get('title', '')
                
                # Generate summary and sentiment (parallel processing in real app)
                summary = gemini_ai.generate_summary(content)
                sentiment = gemini_ai.analyze_sentiment(content)
                
                enhanced_article = {
                    **article,
                    'ai_summary': summary,
                    'sentiment': sentiment,
                    'category': category
                }
                enhanced_articles.append(enhanced_article)
                
            except Exception as e:
                logging.error(f"Error enhancing article: {str(e)}")
                # Add fallback article without AI features
                enhanced_article = {
                    **article,
                    'ai_summary': article.get('description', 'Summary not available.'),
                    'sentiment': 'Neutral',
                    'category': category
                }
                enhanced_articles.append(enhanced_article)
        
        return jsonify({'articles': enhanced_articles})
        
    except Exception as e:
        logging.error(f"Error fetching news: {str(e)}")
        return jsonify({'error': str(e)}), 500

@news_bp.route('/search', methods=['POST'])
@login_required
@no_cache
def search_news():
    """Search news by keyword (AJAX endpoint)"""
    try:
        keyword = request.json.get('keyword', '').strip()
        
        if not keyword:
            return jsonify({'error': 'Search keyword required'}), 400
        
        # Fetch search results
        articles = news_fetcher.search_news(keyword=keyword, page_size=8)
        
        # Enhance articles with AI
        enhanced_articles = []
        for article in articles:
            try:
                content = article.get('content') or article.get('description') or article.get('title', '')
                
                summary = gemini_ai.generate_summary(content)
                sentiment = gemini_ai.analyze_sentiment(content)
                
                enhanced_article = {
                    **article,
                    'ai_summary': summary,
                    'sentiment': sentiment,
                    'category': 'search'
                }
                enhanced_articles.append(enhanced_article)
                
            except Exception as e:
                logging.error(f"Error enhancing search article: {str(e)}")
                enhanced_article = {
                    **article,
                    'ai_summary': article.get('description', 'Summary not available.'),
                    'sentiment': 'Neutral',
                    'category': 'search'
                }
                enhanced_articles.append(enhanced_article)
        
        return jsonify({'articles': enhanced_articles})
        
    except Exception as e:
        logging.error(f"Error searching news: {str(e)}")
        return jsonify({'error': str(e)}), 500