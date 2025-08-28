// FarmBoy Chatbot JavaScript Implementation

document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements for new chat area
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    if (!chatForm || !chatInput || !chatMessages) return;
    const messageContainer = chatMessages;

    // Add initial bot message
    addMessage('Hello! I\'m FarmBoy Assistant. How can I help you today?', 'bot');

    // Business information and responses
    const businessInfo = {
        name: 'GreenQash',
        hours: 'Available 24/7',
        location: 'Freelance online service providers from Uganda',
        email: 'greenqash@gmail.com',
        phone: '+1 (555) 123-4567',
        services: ['Boost Social Media content', 'Online Money making oportunities', 'Making of digital adds', 'IT Solutions', 'Web development']
    };

    // Response patterns
    const responses = {
        greeting: ['Hello!', 'Hi there!', 'Greetings!', 'How can I help you?'],
        thanks: ['You\'re welcome!', 'Happy to help!', 'Anytime!', 'My pleasure!'],
        farewell: ['Goodbye!', 'Have a great day!', 'Come back soon!', 'See you later!'],
        default: ['I\'m not sure I understand. Could you rephrase that?', 'Could you provide more details?', 'I don\'t have information about that yet.']
    };

    // Chatbot knowledge base
    const knowledgeBase = {
        'hours': `We're ${businessInfo.hours}.`,
        'open': `We're ${businessInfo.hours}.`,
        'time': `We're ${businessInfo.hours}.`,
        'location': `We're ${businessInfo.location}.`,
        'address': `We're located at ${businessInfo.location}.`,
        'email': `You can reach us at ${businessInfo.email}.`,
        'contact': `You can call us at ${businessInfo.phone} or email ${businessInfo.email}.`,
        'phone': `Our phone number is ${businessInfo.phone}.`,
        'services': `We offer: ${businessInfo.services.join(', ')}.`,
        'products': `We offer: ${businessInfo.services.join(', ')}.`,
        'organic': 'All our products are certified organic and locally sourced.',
        'delivery': 'We offer delivery within a 20-mile radius for orders over $50.',
        'payment': 'We accept crpto, paypal, and mobile payments.',
        'tasks': 'View tiktok and Youtube videos posted, Answer the trivia questions, like and share where necessary, Reffer your friends, and more.',
        'about': `GreenQash is an online money making business that enables you to earn an extra cash through various tasks.`
    };

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '10px';
        messageDiv.style.padding = '8px 12px';
        messageDiv.style.borderRadius = '18px';
        messageDiv.style.maxWidth = '80%';
        messageDiv.style.wordWrap = 'break-word';
        messageDiv.style.animation = 'fadeIn 0.3s ease-in';

        if (sender === 'user') {
            messageDiv.style.backgroundColor = '#3498db';
            messageDiv.style.color = 'white';
            messageDiv.style.marginLeft = 'auto';
            messageDiv.textContent = text;
        } else {
            messageDiv.style.backgroundColor = '#eaeaea';
            messageDiv.style.color = '#333';
            messageDiv.style.marginRight = 'auto';
            messageDiv.innerHTML = `<strong>FarmBoy:</strong> ${text}`;
        }

        messageContainer.appendChild(messageDiv);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // Process user input and generate response
    function processInput(input) {
        const lowerInput = input.toLowerCase().trim();

        // Check for greetings
        if (lowerInput.match(/\b(hi|hello|hey|howdy)\b/)) {
            return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
        }

        // Check for thanks
        if (lowerInput.match(/\b(thanks|thank you|appreciate)\b/)) {
            return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
        }

        // Check for goodbye
        if (lowerInput.match(/\b(bye|goodbye|see you|farewell)\b/)) {
            return responses.farewell[Math.floor(Math.random() * responses.farewell.length)];
        }

        // Check knowledge base for matches
        for (const [key, value] of Object.entries(knowledgeBase)) {
            if (lowerInput.includes(key)) {
                return value;
            }
        }

        // Default response if no matches found
        return responses.default[Math.floor(Math.random() * responses.default.length)];
    }

    // Handle form submission
    chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const userInput = chatInput.value.trim();
        if (userInput === '') return;
        addMessage(userInput, 'user');
        chatInput.value = '';
        setTimeout(() => {
            const response = processInput(userInput);
            addMessage(response, 'bot');
        }, 600);
    });

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        #messageContainer::-webkit-scrollbar {
            width: 6px;
        }
        #messageContainer::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        #messageContainer::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 10px;
        }
        #messageContainer::-webkit-scrollbar-thumb:hover {
            background: #aaa;
        }
    `;
    document.head.appendChild(style);

    // Add event listener for Enter key
    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
});
