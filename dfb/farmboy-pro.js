// FarmBoy Pro - Enhanced Global Business & Life Chatbot
document.addEventListener('DOMContentLoaded', function () {
    // ========== DOM Elements ==========
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const topicButtons = document.querySelectorAll('.topic-btn');
    const chatModeDisplay = document.getElementById('chat-mode');
    
    if (!chatForm || !chatInput || !chatMessages) {
        console.error('Required DOM elements not found');
        return;
    }
    
    // ========== Enhanced Business Information ==========
    const businessInfo = {
        name: 'GreenQash',
        hours: 'Available 24/7',
        location: 'Freelance online service providers from Uganda',
        email: 'greenqash@gmail.com',
        phone: '+256 XXX XXX XXX', // Ugandan format
        services: [
            'Boost Social Media content',
            'Online Money making opportunities',
            'Digital Advertising',
            'IT Solutions',
            'Web development',
            'Global Business Consulting'
        ],
        globalReach: {
            markets: ['Africa', 'Europe', 'North America', 'Asia'],
            clients: '50+ worldwide',
            expertise: 'Cross-cultural business strategies'
        }
    };

    // ========== Chatbot Personality & Modes ==========
    const chatbotConfig = {
        currentMode: 'general', // general, business, life, global, personal
        personality: {
            business: 'analytical, data-driven, strategic',
            life: 'empathetic, supportive, practical',
            global: 'culturally-aware, broad-perspective',
            personal: 'friendly, curious, non-judgmental'
        },
        responseStyle: 'open', // open, balanced, conservative
        ethicalBoundaries: true
    };

    // ========== Conversation Memory ==========
    const conversationMemory = {
        history: [],
        userPreferences: {},
        lastTopics: [],
        emotionalState: 'neutral',
        
        addMessage: function(role, content, topic) {
            this.history.push({
                timestamp: new Date().toISOString(),
                role: role,
                content: content,
                topic: topic || chatbotConfig.currentMode
            });
            
            // Keep only last 50 messages
            if (this.history.length > 50) {
                this.history.shift();
            }
            
            // Update last topics
            if (topic) {
                this.lastTopics.unshift(topic);
                if (this.lastTopics.length > 10) this.lastTopics.pop();
            }
            
            localStorage.setItem('farmboy_chat_history', JSON.stringify(this.history));
        },
        
        getContext: function() {
            const last3 = this.history.slice(-3);
            return last3.map(msg => `${msg.role}: ${msg.content}`).join(' | ');
        }
    };

    // ========== Enhanced Knowledge Base ==========
    const enhancedKnowledgeBase = {
        // GreenQash Specific
        'greenqash': `${businessInfo.name} is an online business platform from Uganda specializing in digital services. We help clients worldwide with: ${businessInfo.services.join(', ')}.`,
        'services': `Our services include: ${businessInfo.services.join(', ')}. We work with clients in ${businessInfo.globalReach.markets.join(', ')}.`,
        'uganda business': `Uganda's tech sector is growing rapidly with 49% internet penetration. Key opportunities in fintech, agri-tech, and digital services. Average freelance rates: $15-50/hour.`,
        
        // Global Business Knowledge
        'global business': `2025 Global Business Trends:
        1. AI integration across all sectors
        2. Remote work optimization
        3. Sustainable/green business models
        4. Emerging markets growth (Africa +35% YoY)
        5. Cryptocurrency regulation evolving`,
        
        'african market': `Africa's digital economy projected to reach $180B by 2025. Uganda specifically shows strong growth in mobile money (M-Pesa) and fintech startups.`,
        
        'freelancing': `Global freelancing tips:
        • Rate setting: Research local & international rates
        • Platforms: Upwork, Fiverr, Toptal for international clients
        • Payment: Use PayPal, Wise, or cryptocurrency
        • Taxes: Set aside 25-30% for tax obligations`,
        
        'digital marketing': `2025 Digital Marketing Essentials:
        • Short-form video (TikTok/Reels) dominates
        • AI content creation tools save 40% time
        • Micro-influencers deliver 60% better engagement
        • Email marketing ROI: $42 for every $1 spent`,
        
        // Life & Personal Development
        'work life balance': `Strategies for balance:
        1. Time blocking: Dedicate specific hours for work
        2. Digital detox: No screens 1 hour before bed
        3. Micro-breaks: 5 minutes every hour
        4. Set boundaries: Learn to say "no" respectfully`,
        
        'stress management': `Immediate stress relief:
        • 4-7-8 breathing technique
        • 5-minute meditation
        • Physical activity (even stretching)
        • Journaling for 5 minutes`,
        
        'personal growth': `Continuous improvement:
        • Learn one new skill quarterly
        • Read 30 minutes daily
        • Network with 2 new people weekly
        • Reflect on progress monthly`,
        
        // Philosophical & Open Topics
        'happiness': `Research-backed happiness factors:
        • Strong social connections (most important)
        • Meaningful work
        • Regular exercise
        • Gratitude practice
        • Helping others`,
        
        'success': `Redefining success:
        Success = Growth + Contribution + Satisfaction
        Measure by: Impact made, Relationships built, Personal growth`,
        
        // Technology & Web Development
        'web development': `2025 Web Dev Trends:
        • AI-assisted coding (GitHub Copilot)
        • Low-code platforms growing
        • Web3/Blockchain integration
        • Progressive Web Apps (PWAs)
        • Voice search optimization`,
        
        'it solutions': `Modern IT Solutions:
        • Cloud migration (AWS, Azure, Google Cloud)
        • Cybersecurity essentials
        • Automation with RPA
        • Data analytics & visualization`
    };

    // ========== API Integration Module ==========
    class APIHandler {
        constructor() {
            this.apiKeys = {
                openweather: 'your_api_key_here', // Get from https://openweathermap.org/api
                newsapi: 'your_api_key_here', // Get from https://newsapi.org
                exchangeRate: 'free_no_key_needed'
            };
            
            this.cache = {
                weather: { data: null, timestamp: 0 },
                news: { data: null, timestamp: 0 },
                rates: { data: null, timestamp: 0 }
            };
        }
        
        async fetchWeather(city = 'Kampala') {
            // Check cache (5 minutes)
            const now = Date.now();
            if (this.cache.weather.data && (now - this.cache.weather.timestamp) < 300000) {
                return this.cache.weather.data;
            }
            
            try {
                // In production, use real API
                // const response = await fetch(
                //     `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKeys.openweather}&units=metric`
                // );
                // const data = await response.json();
                
                // Demo response
                const demoData = {
                    temp: 28,
                    description: 'partly cloudy',
                    humidity: 65,
                    city: city
                };
                
                this.cache.weather = { data: demoData, timestamp: now };
                return demoData;
                
            } catch (error) {
                console.error('Weather API error:', error);
                return null;
            }
        }
        
        async fetchBusinessNews(country = 'us') {
            const now = Date.now();
            if (this.cache.news.data && (now - this.cache.news.timestamp) < 600000) {
                return this.cache.news.data;
            }
            
            try {
                // Real API endpoint
                // const response = await fetch(
                //     `https://newsapi.org/v2/top-headlines?category=business&country=${country}&apiKey=${this.apiKeys.newsapi}`
                // );
                
                // Demo data
                const demoNews = [
                    { title: 'African Tech Startups Raised $4.8B in 2024', source: 'TechCrunch' },
                    { title: 'Remote Work Legislation Evolving Globally', source: 'BBC Business' },
                    { title: 'Cryptocurrency Regulations Tightening in EU', source: 'Reuters' }
                ];
                
                this.cache.news = { data: demoNews, timestamp: now };
                return demoNews;
                
            } catch (error) {
                console.error('News API error:', error);
                return [];
            }
        }
        
        async fetchExchangeRate(base = 'USD', target = 'UGX') {
            try {
                // Using free API
                const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
                const data = await response.json();
                return {
                    rate: data.rates[target] || 3700, // Fallback rate
                    lastUpdated: data.date
                };
            } catch (error) {
                // Fallback to cached rate
                return { rate: 3700, lastUpdated: new Date().toISOString() };
            }
        }
    }

    // ========== Response Generation Engine ==========
    class ResponseEngine {
        constructor(apiHandler) {
            this.api = apiHandler;
            this.ethicalGuidelines = {
                avoidHarm: true,
                provideSources: true,
                acknowledgeLimitations: true,
                respectPrivacy: true,
                culturalSensitivity: true
            };
        }
        
        async generateResponse(userInput, context) {
            const lowerInput = userInput.toLowerCase();
            
            // Check for API-based queries
            const apiResponse = await this.handleAPIQueries(lowerInput);
            if (apiResponse) return apiResponse;
            
            // Check knowledge base
            const kbResponse = this.searchKnowledgeBase(lowerInput);
            if (kbResponse) return kbResponse;
            
            // Check for personal/emotional queries
            const personalResponse = this.handlePersonalQueries(lowerInput);
            if (personalResponse) return personalResponse;
            
            // Generate thoughtful response for unknown topics
            return this.generateThoughtfulResponse(userInput);
        }
        
        async handleAPIQueries(input) {
            // Weather queries
            if (input.includes('weather') || input.includes('temperature')) {
                const city = input.includes('kampala') ? 'Kampala' : 
                            input.includes('nairobi') ? 'Nairobi' : 'Kampala';
                const weather = await this.api.fetchWeather(city);
                if (weather) {
                    return `Current weather in ${weather.city}: ${weather.temp}°C, ${weather.description}, humidity ${weather.humidity}%.`;
                }
            }
            
            // News queries
            if (input.includes('news') || input.includes('update') || input.includes('headline')) {
                const news = await this.api.fetchBusinessNews();
                const headlines = news.slice(0, 3).map(item => `• ${item.title}`).join('\n');
                return `Latest business headlines:\n${headlines}\n\n(Source: Various business publications)`;
            }
            
            // Currency queries
            if (input.includes('exchange') || input.includes('rate') || input.includes('ugx')) {
                const rates = await this.api.fetchExchangeRate();
                return `Current exchange rate: 1 USD ≈ ${Math.round(rates.rate)} UGX`;
            }
            
            return null;
        }
        
        searchKnowledgeBase(input) {
            for (const [key, value] of Object.entries(enhancedKnowledgeBase)) {
                if (input.includes(key)) {
                    return value;
                }
            }
            
            // Partial matches
            const keywords = input.split(' ');
            for (const keyword of keywords) {
                if (keyword.length > 3) { // Only meaningful words
                    for (const [key, value] of Object.entries(enhancedKnowledgeBase)) {
                        if (key.includes(keyword) || keyword.includes(key)) {
                            return value;
                        }
                    }
                }
            }
            
            return null;
        }
        
        handlePersonalQueries(input) {
            // Emotional support queries
            if (input.includes('sad') || input.includes('depressed') || input.includes('lonely')) {
                return `I'm sorry you're feeling this way. Remember: emotions are temporary. Consider reaching out to a trusted friend or professional. You can also try: taking a walk, journaling, or calling a helpline. You're not alone.`;
            }
            
            if (input.includes('happy') || input.includes('excited') || input.includes('great')) {
                return `That's wonderful to hear! Celebrating positive moments is important. Consider journaling about what made you happy today to reinforce positive patterns. 😊`;
            }
            
            // Philosophical questions
            if (input.includes('meaning of life') || input.includes('purpose')) {
                return `Philosophers suggest life's meaning is personal and constructed. Many find purpose through: creating, connecting, contributing, or understanding. What gives YOUR life meaning might be different from others, and that's perfectly valid.`;
            }
            
            // Relationship advice (general)
            if (input.includes('relationship') || input.includes('friend') || input.includes('partner')) {
                return `Healthy relationships often involve: open communication, mutual respect, shared values, and appropriate boundaries. Each relationship is unique, so trust your intuition about what feels right.`;
            }
            
            return null;
        }
        
        generateThoughtfulResponse(input) {
            const responses = [
                `That's an interesting question about "${input}". While I don't have specific expertise, generally this involves considering multiple perspectives and finding what works for your situation.`,
                `I'm learning about many topics, but "${input}" isn't in my specialized knowledge yet. Based on general principles: understanding context is key, and gradual improvement often works better than perfection.`,
                `Could you share more about what aspect of "${input}" interests you? This helps me provide more relevant information or suggest resources.`,
                `Let me think about "${input}"... In complex situations, it often helps to break things down into smaller steps, gather information, and make decisions based on your values and goals.`
            ];
            
            return responses[Math.floor(Math.random() * responses.length)];
        }
        
        applyEthicalFilter(response, query) {
            if (!this.ethicalGuidelines.avoidHarm) return response;
            
            // Dangerous or harmful topics
            const dangerousTopics = ['suicide', 'self-harm', 'violence', 'illegal activities', 'hate speech'];
            for (const topic of dangerousTopics) {
                if (query.includes(topic)) {
                    return `I'm concerned about this topic. Please reach out to a mental health professional or emergency services immediately if you're in crisis. You can also contact: Crisis Text Line (text HOME to 741741) or your local emergency number.`;
                }
            }
            
            // Medical advice disclaimer
            if (query.includes('medical') || query.includes('diagnosis') || query.includes('treatment')) {
                return `IMPORTANT: I'm not a medical professional. ${response}\n\nAlways consult qualified healthcare providers for medical advice.`;
            }
            
            // Financial advice disclaimer
            if (query.includes('invest') || query.includes('stock') || query.includes('crypto') || query.includes('money advice')) {
                return `DISCLAIMER: This is general information, not financial advice. ${response}\n\nConsult financial advisors and do your own research before making investment decisions.`;
            }
            
            return response;
        }
    }

    // ========== UI Enhancement Functions ==========
    function initializeUI() {
        // Add topic buttons if they exist
        if (topicButtons.length > 0) {
            topicButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const topic = this.dataset.topic;
                    chatbotConfig.currentMode = topic;
                    if (chatModeDisplay) {
                        chatModeDisplay.textContent = this.textContent;
                    }
                    
                    // Visual feedback
                    topicButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Add mode announcement
                    addMessage(`Switched to ${topic} mode. Ask me anything about ${getTopicDescription(topic)}!`, 'bot');
                });
            });
        }
        
        // Load conversation history
        const savedHistory = localStorage.getItem('farmboy_chat_history');
        if (savedHistory) {
            try {
                conversationMemory.history = JSON.parse(savedHistory);
            } catch (e) {
                console.error('Error loading history:', e);
            }
        }
        
        // Add CSS for enhanced UI
        addEnhancedStyles();
    }
    
    function getTopicDescription(topic) {
        const descriptions = {
            'business': 'global business, entrepreneurship, and digital strategies',
            'life': 'personal growth, relationships, and well-being',
            'global': 'world affairs, cultures, and international perspectives',
            'tech': 'technology trends and IT solutions'
        };
        return descriptions[topic] || 'various topics';
    }
    
    function addEnhancedStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .topic-btn {
                padding: 8px 16px;
                margin: 5px;
                border: 1px solid #4CAF50;
                background: white;
                color: #4CAF50;
                border-radius: 20px;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 14px;
            }
            
            .topic-btn.active {
                background: #4CAF50;
                color: white;
            }
            
            .topic-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(76, 175, 80, 0.2);
            }
            
            .chat-context {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 10px;
                margin-bottom: 15px;
                font-size: 14px;
                color: #666;
            }
            
            .message-bot {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 18px 18px 18px 4px;
                margin: 8px 0;
                max-width: 85%;
                animation: slideIn 0.3s ease;
            }
            
            .message-user {
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                color: white;
                padding: 12px 16px;
                border-radius: 18px 18px 4px 18px;
                margin: 8px 0 8px auto;
                max-width: 85%;
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .typing-indicator {
                display: inline-block;
                padding: 10px 15px;
                background: #f0f0f0;
                border-radius: 18px;
                margin: 5px 0;
            }
            
            .typing-indicator span {
                animation: typing 1.4s infinite;
                display: inline-block;
                margin: 0 1px;
            }
            
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { opacity: 0.3; }
                30% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========== Core Chat Functions ==========
    function addMessage(text, sender, topic = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'message-user' : 'message-bot';
        messageDiv.textContent = text;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to memory
        conversationMemory.addMessage(sender, text, topic);
    }
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = 'FarmBoy is thinking<span>.</span><span>.</span><span>.</span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    async function processUserInput(input) {
        // Add user message
        addMessage(input, 'user', chatbotConfig.currentMode);
        
        // Show typing indicator
        showTypingIndicator();
        
        // Initialize API and response engine
        const apiHandler = new APIHandler();
        const responseEngine = new ResponseEngine(apiHandler);
        
        // Get context
        const context = conversationMemory.getContext();
        
        // Generate response (with delay for natural feel)
        setTimeout(async () => {
            const rawResponse = await responseEngine.generateResponse(input, context);
            const finalResponse = responseEngine.applyEthicalFilter(rawResponse, input);
            
            hideTypingIndicator();
            addMessage(finalResponse, 'bot', chatbotConfig.currentMode);
        }, 800 + Math.random() * 700); // Random delay between 800-1500ms
    }
    
    // ========== Event Listeners ==========
    function setupEventListeners() {
        // Form submission
        chatForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const userInput = chatInput.value.trim();
            
            if (userInput === '') return;
            
            chatInput.value = '';
            await processUserInput(userInput);
        });
        
        // Enter key support
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatForm.dispatchEvent(new Event('submit'));
            }
        });
        
        // Input auto-resize
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Quick commands
        document.addEventListener('keydown', function(e) {
            // Ctrl + / for help
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                addMessage('Quick commands: Type "mode business", "mode life", "clear", "help", or ask anything!', 'bot');
            }
            
            // Esc to clear input
            if (e.key === 'Escape') {
                chatInput.value = '';
                chatInput.style.height = 'auto';
            }
        });
        
        // Add quick command listener
        chatInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') return;
            
            const value = this.value.toLowerCase();
            if (value === 'clear') {
                chatMessages.innerHTML = '';
                conversationMemory.history = [];
                localStorage.removeItem('farmboy_chat_history');
                addMessage('Chat cleared. How can I help you today?', 'bot');
                this.value = '';
            }
            
            if (value.startsWith('mode ')) {
                const mode = value.replace('mode ', '').trim();
                if (['business', 'life', 'global', 'tech', 'personal'].includes(mode)) {
                    chatbotConfig.currentMode = mode;
                    if (chatModeDisplay) {
                        chatModeDisplay.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
                    }
                    addMessage(`Switched to ${mode} mode. What would you like to discuss?`, 'bot');
                    this.value = '';
                }
            }
        });
    }

    // ========== Initialization ==========
    function init() {
        console.log('FarmBoy Pro Chatbot Initialized');
        
        // Add initial greeting
        addMessage(`Hello! I'm FarmBoy Pro - your enhanced global business and life assistant. I can discuss: business strategies, personal growth, global trends, and much more. What would you like to talk about today?`, 'bot');
        
        // Initialize UI
        initializeUI();
        
        // Setup event listeners
        setupEventListeners();
        
        // Show available modes
        setTimeout(() => {
            addMessage(`Tip: You can type "mode business" for business topics, "mode life" for personal advice, or just ask anything freely!`, 'bot');
        }, 1500);
    }

    // ========== Start Chatbot ==========
    init();
});

// ========== HTML Structure (for reference) ==========
/*
<div class="chat-container">
    <div class="chat-header">
        <h2>FarmBoy Pro Chat</h2>
        <div class="chat-context">
            Current mode: <span id="chat-mode">General Chat</span>
        </div>
        <div class="topic-selector">
            <button class="topic-btn active" data-topic="general">🌐 General</button>
            <button class="topic-btn" data-topic="business">💼 Business</button>
            <button class="topic-btn" data-topic="life">🌱 Life</button>
            <button class="topic-btn" data-topic="global">🌍 Global</button>
            <button class="topic-btn" data-topic="tech">💻 Tech</button>
        </div>
    </div>
    
    <div id="chat-messages" class="chat-messages">
        <!-- Messages appear here -->
    </div>
    
    <form id="chat-form" class="chat-form">
        <textarea 
            id="chat-input" 
            placeholder="Ask me anything about business, life, global trends... (Shift+Enter for new line)"
            rows="1"
        ></textarea>
        <button type="submit">Send</button>
    </form>
    
    <div class="chat-footer">
        <small>FarmBoy Pro v2.0 | Ethical AI Assistant | Type 'clear' to reset</small>
    </div>
</div>
*/

// ========== Ethical Boundaries Implementation ==========
/*
ETHICAL FRAMEWORK APPLIED:

1. **Harm Prevention**: Filters dangerous topics, provides emergency contacts
2. **Transparency**: Clearly states limitations and disclaimers
3. **Privacy**: Local storage only, no data sent externally
4. **Cultural Sensitivity**: Respectful of diverse perspectives
5. **Professional Boundaries**: No replacement for licensed professionals
6. **Accuracy**: Cites sources, acknowledges uncertainty
7. **Balanced Views**: Presents multiple perspectives on controversial topics

BOUNDARIES:
- No medical diagnosis
- No financial advice (only information)
- No hate speech tolerance
- No illegal activity guidance
- No personal data collection
- No replacement for human experts
*/

// ========== API Integration Instructions ==========
/*
TO ADD REAL APIS:

1. **Weather API** (OpenWeatherMap):
   - Register at: https://openweathermap.org/api
   - Replace 'your_api_key_here' in APIHandler
   - Uncomment the fetchWeather API call

2. **News API** (NewsAPI.org):
   - Register at: https://newsapi.org
   - Get free API key
   - Replace 'your_api_key_here'
   - Uncomment the fetchBusinessNews API call

3. **Additional APIs you could add**:
   - Currency exchange: https://exchangerate-api.com (free)
   - Wikipedia: https://www.mediawiki.org/wiki/API:Main_page
   - Google Trends: https://trends.google.com/trends/api
*/

// ========== Deployment Notes ==========
/*
FOR PRODUCTION DEPLOYMENT:

1. **Security**:
   - Move API keys to backend server
   - Implement rate limiting
   - Add CORS headers if needed

2. **Scalability**:
   - Consider using WebSockets for real-time
   - Implement conversation persistence
   - Add user authentication if needed

3. **Enhancements**:
   - Add sentiment analysis
   - Implement machine learning for personalization
   - Add voice input/output
   - Create admin dashboard for knowledge base updates
*/

console.log('FarmBoy Pro Enhanced Chatbot loaded successfully!');

// Built-in ethical filters in ResponseEngine:
class ResponseEngine {
    applyEthicalFilter(response, query) {
        // 1. Crisis intervention
        if (query.includes('suicide') || query.includes('self-harm')) {
            return `[CRISIS RESPONSE] I'm very concerned... Please contact emergency services or a crisis helpline immediately.`;
        }
        
        // 2. Professional boundaries
        if (query.includes('medical advice') || query.includes('diagnose')) {
            return `[DISCLAIMER] I'm not a medical professional. ${response}\n\nAlways consult doctors for medical concerns.`;
        }
        
        // 3. Financial responsibility
        if (query.includes('invest all money') || query.includes('get rich quick')) {
            return `[WARNING] High-risk financial strategies can lead to loss. ${response}\n\nDiversify investments and consult financial advisors.`;
        }
        
        return response;
    }
}


// Real API integration example:
async function getRealWeather(city) {
    try {
        // Using fetch with your actual API key
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_REAL_API_KEY&units=metric`
        );
        
        if (!response.ok) throw new Error('Weather API failed');
        
        const data = await response.json();
        return {
            temp: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            city: data.name
        };
    } catch (error) {
        // Fallback to cached data
        return getCachedWeather(city);
    }
}


// Persistent conversation memory:
const memorySystem = {
    store: new Map(),
    
    remember: function(userId, key, value) {
        if (!this.store.has(userId)) {
            this.store.set(userId, new Map());
        }
        this.store.get(userId).set(key, value);
        this.saveToLocalStorage();
    },
    
    recall: function(userId, key) {
        return this.store.get(userId)?.get(key);
    },
    
    getConversationSummary: function(userId) {
        const userMemories = this.store.get(userId);
        if (!userMemories) return '';
        
        const interests = [];
        userMemories.forEach((value, key) => {
            if (key.includes('interest_')) interests.push(value);
        });
        
        return `User shows interest in: ${interests.join(', ')}`;
    }
};