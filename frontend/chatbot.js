// chatbot.js
(function initChatbot() {
    if (document.getElementById('chatbot-container')) return;
    
    // 1. Inject HTML into body
    const chatbotHTML = `
        <div id="chatbot-container">
            <div id="chatbot-window">
                
                <!-- Home View -->
                <div class="chatbot-view active" id="chatbot-home-view">
                    <div class="chatbot-home-header">
                        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                            <h2 style="margin:0;">BusBot</h2>
                            <button id="chatbot-close-btn1" title="Close" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; opacity:0.8; padding:0; outline:none;"><i class="fas fa-times"></i></button>
                        </div>
                        <div class="chatbot-status"><div class="status-dot"></div> Online</div>
                        <div class="chatbot-welcome">Hi! 👋<br>How can I help you today?</div>
                        <div class="chatbot-subtitle">Your smart travel assistant for all bus-related queries.</div>
                        <svg class="chatbot-graphic" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="white" opacity="0.1">
                            <path d="M10 30 h80 a10 10 0 0 1 10 10 v40 a10 10 0 0 1 -10 10 h-80 a10 10 0 0 1 -10 -10 v-40 a10 10 0 0 1 10 -10 z M25 75 a5 5 0 1 0 0 -10 a5 5 0 0 0 0 10 z M75 75 a5 5 0 1 0 0 -10 a5 5 0 0 0 0 10 z M20 40 h60 v15 h-60 z"/>
                        </svg>
                    </div>
                    
                    <div class="chatbot-actions">
                        <button class="chat-action-btn" data-query="How do I add money to my wallet?">
                            <div class="action-icon green"><i class="fas fa-wallet"></i></div>
                            <div class="action-text">
                                <h4>Wallet & Recharge</h4>
                                <p>Wallet recharge, history, refunds</p>
                            </div>
                            <i class="fas fa-chevron-right action-arrow"></i>
                        </button>
                        
                        <button class="chat-action-btn" data-query="When is the next bus from Konaje to Mangalore?">
                            <div class="action-icon indigo"><i class="fas fa-bus"></i></div>
                            <div class="action-text">
                                <h4>Bus Questions</h4>
                                <p>Routes, timings, fares</p>
                            </div>
                            <i class="fas fa-chevron-right action-arrow"></i>
                        </button>
                        
                        <button class="chat-action-btn" data-query="Forgot password">
                            <div class="action-icon orange"><i class="fas fa-unlock-alt"></i></div>
                            <div class="action-text">
                                <h4>Forgot Password</h4>
                                <p>Reset your password</p>
                            </div>
                            <i class="fas fa-chevron-right action-arrow"></i>
                        </button>
                        
                        <button class="chat-action-btn" data-query="Change my password">
                            <div class="action-icon blue"><i class="fas fa-key"></i></div>
                            <div class="action-text">
                                <h4>Change Password</h4>
                                <p>Update your password</p>
                            </div>
                            <i class="fas fa-chevron-right action-arrow"></i>
                        </button>
                        


                        <button class="chat-action-btn" data-query="Register complaint">
                            <div class="action-icon red"><i class="fas fa-exclamation-circle"></i></div>
                            <div class="action-text">
                                <h4>Complaints</h4>
                                <p>Report delays, issues</p>
                            </div>
                            <i class="fas fa-chevron-right action-arrow"></i>
                        </button>
                    </div>
                    
                    <div class="chatbot-footer">
                        <i class="fas fa-shield-alt"></i> Your data is secure with us
                    </div>
                </div>

                <!-- Chat View -->
                <div class="chatbot-view" id="chatbot-chat-view">
                    <div class="chatbot-chat-header">
                        <div class="chatbot-header-left">
                            <div class="chatbot-avatar-small">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="chatbot-header-info">
                                <h3>BusBot</h3>
                                <div class="chatbot-status"><div class="status-dot"></div> Online • 24/7 Support</div>
                            </div>
                        </div>
                        <div class="chatbot-header-actions">
                            <button id="chatbot-refresh-btn" title="Home"><i class="fas fa-sync-alt"></i></button>
                            <button id="chatbot-close-btn2" title="Close"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="chat-date-divider"><span>Today</span></div>
                        
                        <div class="chat-bubble-wrapper bot">
                            <div class="bubble-avatar"><i class="fas fa-robot"></i></div>
                            <div class="chat-bubble bot">
                                👋 <b>Hello! I'm BusBot.</b><br>
                                How can I assist you with your bus travel today?
                                <span class="chat-time">Now</span>
                            </div>
                        </div>
                        
                        <div class="chat-quick-replies">
                            <button class="quick-reply-btn" data-query="Check Bus Timings"><i class="far fa-clock"></i> Check Bus Timings</button>
                            <button class="quick-reply-btn" data-query="Track My Bus"><i class="fas fa-map-marker-alt"></i> Track My Bus</button>
                        </div>
                    </div>
                    
                    <div class="chat-input-area">
                        <div class="chat-input-wrapper">
                            <input type="text" id="chatbot-input" placeholder="Type your message..." autocomplete="off"/>
                            <button class="attach-btn"><i class="fas fa-paperclip"></i></button>
                        </div>
                        <button id="chatbot-send-btn" class="send-btn">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    
                    <div class="chat-footer-actions">
                        <button class="chat-action-pill" data-query="View Route"><i class="fas fa-map"></i> View Route</button>
                        <button class="chat-action-pill" id="chatbot-more-options-btn"><i class="fas fa-ellipsis-h"></i> More Options</button>
                    </div>
                </div>

            </div>
            
            <!-- Image Lightbox Modal -->
            <div id="chatbot-lightbox" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index: 20000; justify-content:center; align-items:center; flex-direction:column;">
                <button id="chatbot-lightbox-close" style="position:absolute; top:20px; right:20px; background:none; border:none; color:white; font-size:2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
                <img id="chatbot-lightbox-img" src="" style="max-width:90%; max-height:90%; border-radius:8px; object-fit:contain;">
            </div>
            
            <button id="chatbot-toggle-btn">
                <div class="chatbot-dot"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
                    <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
                    <path d="M9 14c.8 1.2 2 2 3 2s2.2-.8 3-2"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // 2. DOM Elements
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn1 = document.getElementById('chatbot-close-btn1');
    const closeBtn2 = document.getElementById('chatbot-close-btn2');
    const refreshBtn = document.getElementById('chatbot-refresh-btn');
    const chatWindow = document.getElementById('chatbot-window');
    
    const homeView = document.getElementById('chatbot-home-view');
    const chatView = document.getElementById('chatbot-chat-view');
    
    const sendBtn = document.getElementById('chatbot-send-btn');
    const chatInput = document.getElementById('chatbot-input');
    const messagesContainer = document.getElementById('chatbot-messages');

    // Resize Logic (Top-Left Drag)
    const resizeHandle = document.createElement('div');
    // Subtle visual indicator in the corner
    resizeHandle.innerHTML = '<svg style="position:absolute; top:4px; left:4px; width:12px; height:12px; color:rgba(255,255,255,0.5); transform:rotate(90deg);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><line x1="9" y1="21" x2="21" y2="9"></line><line x1="21" y1="3" x2="21" y2="3"></line></svg>';
    resizeHandle.style.cssText = 'position:absolute; top:0; left:0; width:24px; height:24px; cursor:nwse-resize; z-index:10001; background: transparent;';
    chatWindow.appendChild(resizeHandle);

    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = chatWindow.offsetWidth;
        startHeight = chatWindow.offsetHeight;
        document.addEventListener('mousemove', doResize);
        document.addEventListener('mouseup', stopResize);
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    function doResize(e) {
        if (!isResizing) return;
        const width = startWidth - (e.clientX - startX);
        const height = startHeight - (e.clientY - startY);
        // Min max constraints
        if (width > 320 && width < window.innerWidth - 40) chatWindow.style.width = width + 'px';
        if (height > 450 && height < window.innerHeight - 40) chatWindow.style.height = height + 'px';
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
        document.body.style.userSelect = '';
    }

    // Toggles
    window.toggleChatbot = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            if (typeof showToast === 'function') {
                showToast('Please login first to use the ChatBot.', 'warning');
            } else {
                alert('Please login first to use the ChatBot.');
            }
            return;
        }
        
        chatWindow.classList.toggle('open');
        const dot = toggleBtn.querySelector('.chatbot-dot');
        if (dot) dot.style.display = 'none'; // hide dot on open
    };
    toggleBtn.addEventListener('click', window.toggleChatbot);

    closeBtn1.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    closeBtn2.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    refreshBtn.addEventListener('click', () => {
        chatView.classList.remove('active');
        homeView.classList.add('active');
    });

    const moreOptionsBtn = document.getElementById('chatbot-more-options-btn');
    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', () => {
            chatView.classList.remove('active');
            homeView.classList.add('active');
        });
    }

    function switchToChat() {
        homeView.classList.remove('active');
        chatView.classList.add('active');
        chatInput.focus();
    }

    // Attach events to quick action buttons
    const actionBtns = document.querySelectorAll('.chat-action-btn, .quick-reply-btn, .chat-action-pill');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            if (query) {
                switchToChat();
                chatInput.value = query;
                sendMessage();
            }
        });
    });

    // Lightbox Functionality
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('chat-img-thumb')) {
            const lightbox = document.getElementById('chatbot-lightbox');
            const lightboxImg = document.getElementById('chatbot-lightbox-img');
            lightboxImg.src = e.target.src;
            lightbox.style.display = 'flex';
        }
        if (e.target.id === 'chatbot-lightbox' || e.target.closest('#chatbot-lightbox-close')) {
            document.getElementById('chatbot-lightbox').style.display = 'none';
        }
    });

    // Formatting time
    function getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Chat Logic
    function appendMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-bubble-wrapper ${sender}`;
        
        let avatarHTML = '';
        if (sender === 'bot') {
            avatarHTML = '<div class="bubble-avatar"><i class="fas fa-robot"></i></div>';
        }
        
        const timeHTML = `<span class="chat-time">${getCurrentTime()}</span>`;
        
        wrapper.innerHTML = `
            ${avatarHTML}
            <div class="chat-bubble ${sender}">
                ${text}
                ${timeHTML}
            </div>
        `;
        
        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        try {
            const API_BASE = window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api';
            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: text })
            });

            if (response.ok) {
                const data = await response.json();
                appendMessage(data.reply, 'bot');
            } else {
                appendMessage("Sorry, I am having trouble connecting to the server.", 'bot');
            }
        } catch (error) {
            console.error("Chat error:", error);
            appendMessage("Sorry, something went wrong. Please try again later.", 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
})();
