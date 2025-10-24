// Dashboard functionality for news loading and interactions

class NewsDashboard {
    constructor() {
        this.currentCategory = 'general';
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Category filter change
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.loadNews(this.currentCategory);
            });
        }

        // Search button click
        const searchButton = document.getElementById('searchButton');
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.handleSearch();
            });
        }

        // Search input enter key
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });

            // Debounced search for real-time results (optional)
            // searchInput.addEventListener('input', utils.debounce(() => {
            //     if (searchInput.value.length >= 3) {
            //         this.handleSearch();
            //     }
            // }, 500));
        }
    }

    async loadNews(category) {
        if (this.isLoading) return;
        
        this.showLoading();
        this.hideError();
        this.hideEmptyState();

        try {
            const response = await fetch(`/news/${category}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch news');
            }

            this.displayArticles(data.articles);
            
        } catch (error) {
            console.error('Error loading news:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const keyword = searchInput.value.trim();

        if (!keyword) {
            utils.showNotification('Please enter a search term', 'error');
            return;
        }

        if (this.isLoading) return;

        this.showLoading();
        this.hideError();
        this.hideEmptyState();

        try {
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Search failed');
            }

            this.displayArticles(data.articles, `Search results for "${keyword}"`);
            
        } catch (error) {
            console.error('Error searching news:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayArticles(articles, title = null) {
        const articlesGrid = document.getElementById('articlesGrid');
        
        if (!articles || articles.length === 0) {
            this.showEmptyState(title);
            articlesGrid.innerHTML = '';
            return;
        }

        // Update title if provided (for search results)
        if (title) {
            const welcomeTitle = document.querySelector('.welcome-title');
            if (welcomeTitle) {
                const originalText = `Hello, ${document.body.dataset.username || 'User'}! 👋`;
                welcomeTitle.textContent = title;
                // Restore original title after 5 seconds
                setTimeout(() => {
                    welcomeTitle.textContent = originalText;
                }, 5000);
            }
        }

        const articlesHTML = articles.map(article => this.createArticleCard(article)).join('');
        articlesGrid.innerHTML = articlesHTML;
    }

    createArticleCard(article) {
        const imageUrl = article.urlToImage || '/static/images/default-news.jpg';
        const publishedAt = utils.formatDate(article.publishedAt);
        const summary = article.ai_summary || article.description || 'No summary available.';
        const sentiment = article.sentiment || 'Neutral';
        
        // Get sentiment class and emoji
        let sentimentClass, sentimentEmoji;
        switch(sentiment.toLowerCase()) {
            case 'positive':
                sentimentClass = 'sentiment-positive';
                sentimentEmoji = '🟢';
                break;
            case 'negative':
                sentimentClass = 'sentiment-negative';
                sentimentEmoji = '🔴';
                break;
            default:
                sentimentClass = 'sentiment-neutral';
                sentimentEmoji = '🟡';
        }

        return `
            <div class="article-card">
                <img src="${imageUrl}" alt="${utils.escapeHtml(article.title)}" class="article-image" 
                     onerror="this.src='/static/images/default-news.jpg'">
                <div class="article-content">
                    <div class="article-header">
                        <span class="article-category">${utils.escapeHtml(article.category)}</span>
                        <span class="sentiment-tag ${sentimentClass}">
                            ${sentimentEmoji} ${sentiment}
                        </span>
                    </div>
                    <h3 class="article-title">${utils.escapeHtml(article.title)}</h3>
                    <p class="article-summary">${utils.escapeHtml(summary)}</p>
                    <div class="article-footer">
                        <div>
                            <div class="article-source">${utils.escapeHtml(article.source)}</div>
                            <div class="article-date">${publishedAt}</div>
                        </div>
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more-btn">
                            Read Full
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    showLoading() {
        this.isLoading = true;
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'block';
        
        const articlesGrid = document.getElementById('articlesGrid');
        if (articlesGrid) articlesGrid.style.opacity = '0.5';
    }

    hideLoading() {
        this.isLoading = false;
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.style.display = 'none';
        
        const articlesGrid = document.getElementById('articlesGrid');
        if (articlesGrid) articlesGrid.style.opacity = '1';
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        utils.showNotification(message, 'error');
    }

    hideError() {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) errorDiv.style.display = 'none';
    }

    showEmptyState(title = null) {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) {
            if (title) {
                const emptyTitle = emptyState.querySelector('h3');
                if (emptyTitle) {
                    emptyTitle.textContent = `No results found${title ? ` for "${title}"` : ''}`;
                }
            }
            emptyState.style.display = 'block';
        }
    }

    hideEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.style.display = 'none';
    }
}

// Global functions for template access
function loadNews(category) {
    if (!window.newsDashboard) {
        window.newsDashboard = new NewsDashboard();
    }
    window.newsDashboard.loadNews(category);
}

function searchNews() {
    if (!window.newsDashboard) {
        window.newsDashboard = new NewsDashboard();
    }
    window.newsDashboard.handleSearch();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.newsDashboard = new NewsDashboard();
});