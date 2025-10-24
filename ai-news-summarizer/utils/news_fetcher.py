import requests
import os
from config import Config
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class NewsFetcher:
    """Handles fetching news from NewsAPI.org"""
    
    def __init__(self):
        self.api_key = Config.NEWS_API_KEY
        self.base_url = "https://newsapi.org/v2"
        
    def fetch_top_headlines(self, category='general', country='us', page_size=10):
        """
        Fetch top headlines from NewsAPI
        
        Args:
            category (str): News category
            country (str): Country code
            page_size (int): Number of articles to fetch
            
        Returns:
            list: List of article dictionaries
        """
        try:
            if not self.api_key:
                raise ValueError("NewsAPI key not configured")
                
            url = f"{self.base_url}/top-headlines"
            params = {
                'category': category,
                'country': country,
                'pageSize': page_size,
                'apiKey': self.api_key
            }
            
            logger.info(f"Fetching news for category: {category}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get('articles', [])
                
                # Filter out articles with missing critical data
                filtered_articles = [
                    {
                        'title': article.get('title', 'No title'),
                        'description': article.get('description', 'No description'),
                        'url': article.get('url', '#'),
                        'source': article.get('source', {}).get('name', 'Unknown'),
                        'publishedAt': article.get('publishedAt', ''),
                        'urlToImage': article.get('urlToImage', ''),
                        'content': article.get('content', '')
                    }
                    for article in articles 
                    if article.get('title') and article.get('title') != '[Removed]'
                ]
                
                logger.info(f"Successfully fetched {len(filtered_articles)} articles")
                return filtered_articles
                
            elif response.status_code == 429:
                raise Exception("NewsAPI rate limit exceeded. Please try again later.")
            else:
                raise Exception(f"NewsAPI error: {response.status_code} - {response.text}")
                
        except requests.exceptions.Timeout:
            raise Exception("NewsAPI request timed out")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Error fetching news: {str(e)}")
            raise
    
    def search_news(self, keyword, page_size=10):
        """
        Search news by keyword
        
        Args:
            keyword (str): Search term
            page_size (int): Number of articles to fetch
            
        Returns:
            list: List of article dictionaries
        """
        try:
            if not self.api_key:
                raise ValueError("NewsAPI key not configured")
                
            # Calculate date for last 30 days
            from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            
            url = f"{self.base_url}/everything"
            params = {
                'q': keyword,
                'pageSize': page_size,
                'from': from_date,
                'sortBy': 'publishedAt',
                'language': 'en',
                'apiKey': self.api_key
            }
            
            logger.info(f"Searching news for keyword: {keyword}")
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get('articles', [])
                
                filtered_articles = [
                    {
                        'title': article.get('title', 'No title'),
                        'description': article.get('description', 'No description'),
                        'url': article.get('url', '#'),
                        'source': article.get('source', {}).get('name', 'Unknown'),
                        'publishedAt': article.get('publishedAt', ''),
                        'urlToImage': article.get('urlToImage', ''),
                        'content': article.get('content', '')
                    }
                    for article in articles 
                    if article.get('title') and article.get('title') != '[Removed]'
                ]
                
                logger.info(f"Successfully found {len(filtered_articles)} articles")
                return filtered_articles
                
            elif response.status_code == 429:
                raise Exception("NewsAPI rate limit exceeded. Please try again later.")
            else:
                raise Exception(f"NewsAPI error: {response.status_code} - {response.text}")
                
        except requests.exceptions.Timeout:
            raise Exception("NewsAPI request timed out")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
        except Exception as e:
            logger.error(f"Error searching news: {str(e)}")
            raise