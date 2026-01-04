// block-youtube-api.js - BLOCKS YOUTUBE API LOADING
(function() {
    'use strict';
    
    console.log('🚫 YouTube API Blocker loaded');
    
    // 1. BLOCK script element creation for YouTube API
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                // Block YouTube API specifically
                if (name === 'src' && value && (
                    value.includes('youtube.com/iframe_api') ||
                    value.includes('youtube.com/player_api') ||
                    value.includes('youtube.com/s/player/')
                )) {
                    console.log('🚫 BLOCKED YouTube API script:', value);
                    return; // Prevent setting the src
                }
                return originalSetAttribute.call(this, name, value);
            };
        }
        
        return element;
    };
    
    // 2. BLOCK dynamic script loading
    const originalAppendChild = document.body.appendChild;
    document.body.appendChild = function(child) {
        if (child.tagName === 'SCRIPT' && child.src && child.src.includes('youtube.com/iframe_api')) {
            console.log('🚫 BLOCKED appendChild YouTube API');
            return child; // Don't actually append
        }
        return originalAppendChild.call(this, child);
    };
    
    // 3. Also block insertBefore
    const originalInsertBefore = document.body.insertBefore;
    document.body.insertBefore = function(newNode, referenceNode) {
        if (newNode.tagName === 'SCRIPT' && newNode.src && newNode.src.includes('youtube.com/iframe_api')) {
            console.log('🚫 BLOCKED insertBefore YouTube API');
            return newNode;
        }
        return originalInsertBefore.call(this, newNode, referenceNode);
    };
    
    // 4. Prevent YT object creation
    Object.defineProperty(window, 'YT', {
        set: function(value) {
            console.log('🚫 Attempt to set YT object blocked');
            // Don't allow YT to be set
        },
        get: function() {
            console.log('🚫 Attempt to get YT object blocked');
            return undefined;
        },
        configurable: false
    });
    
    console.log('✅ YouTube API blocker active');
})();