import google.generativeai as genai
import os
from config import Config
import logging
import time

logger = logging.getLogger(__name__)

class GeminiAI:
    """Handles interactions with Google Gemini AI"""
    
    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')  # Using flash for cost efficiency
        else:
            logger.warning("Gemini API key not configured")
    
    def generate_summary(self, article_content, max_retries=3):
        """
        Generate a 2-3 sentence summary of the article
        
        Args:
            article_content (str): The article content to summarize
            max_retries (int): Maximum number of retry attempts
            
        Returns:
            str: Generated summary or fallback message
        """
        if not self.api_key:
            return "AI summarization not available. Please check API configuration."
        
        # Prepare content for summarization
        content_to_summarize = article_content or "No content available"
        if len(content_to_summarize) > 10000:  # Limit content length
            content_to_summarize = content_to_summarize[:10000]
        
        prompt = f"""Summarize the following news article in exactly 2-3 concise sentences. Focus on the key facts and main points. Be objective and informative:

{content_to_summarize}

Summary:"""
        
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                summary = response.text.strip()
                
                # Validate summary length
                if len(summary.split()) >= 10:  # At least 10 words
                    return summary
                else:
                    logger.warning("Summary too short, retrying...")
                    time.sleep(1)  # Wait before retry
                    
            except Exception as e:
                logger.error(f"Gemini API error (attempt {attempt + 1}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Exponential backoff
                continue
        
        return "Unable to generate summary at this time. Please try again later."
    
    def analyze_sentiment(self, article_content, max_retries=3):
        """
        Analyze sentiment of the article content
        
        Args:
            article_content (str): The article content to analyze
            max_retries (int): Maximum number of retry attempts
            
        Returns:
            str: "Positive", "Negative", or "Neutral"
        """
        if not self.api_key:
            return "Neutral"
        
        # Prepare content for sentiment analysis
        content_to_analyze = article_content or "No content available"
        if len(content_to_analyze) > 5000:  # Limit content length
            content_to_analyze = content_to_analyze[:5000]
        
        prompt = f"""Analyze the sentiment of this news article and respond with ONLY one word: Positive, Negative, or Neutral. Be objective:

{content_to_analyze}

Sentiment:"""
        
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                sentiment = response.text.strip().lower()
                
                # Validate response
                if sentiment in ['positive', 'negative', 'neutral']:
                    return sentiment.capitalize()
                else:
                    logger.warning(f"Unexpected sentiment response: {sentiment}")
                    time.sleep(1)
                    
            except Exception as e:
                logger.error(f"Gemini API sentiment error (attempt {attempt + 1}): {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                continue
        
        return "Neutral"  # Default fallback