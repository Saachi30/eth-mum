import React, { useEffect, Component } from 'react';

// Error Boundary Component
class ChatWidgetErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ChatWidget Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Render nothing if there's an error
    }
    return this.props.children;
  }
}

// ChatWidget Component
const ChatWidget = () => {
  useEffect(() => {
    // Safely set window.WebChat configuration
    const initializeWebChat = () => {
      if (typeof window !== 'undefined') {
        window.WebChat = {
          apiKey: '896f69ac2a3bb8028fdb2f0a9de9b75f',
          chatBotId: 'a4cc2c13-f6fc-408f-a74b-4bf2a4552b51',
          sourceLanguageCode: 'en',
          modelname: 'renewabableenergyy',
          refreshToken: '',
          username: 'abhs413403',
          chatbotname: 'renewableenergyy',
          environment: 'stg',
          width: 450,
          height: 800,
          poweredByText: 'KalpBot',
          poweredByTextLink: 'https://maibot.net'
        };
      }
    };

    // Function to load external script
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        try {
          const existingScript = document.querySelector('script[src="https://chat-bot-c3ms.vercel.app/index.min.js"]');
          if (existingScript) {
            resolve();
            return;
          }

          const script = document.createElement('script');
          script.src = 'https://chat-bot-c3ms.vercel.app/index.min.js';
          script.async = true;
          script.defer = true;
          
          script.onload = () => {
            resolve();
          };
          
          script.onerror = (error) => {
            reject(new Error(`Script loading error: ${error.message}`));
          };

          document.body.appendChild(script);
        } catch (error) {
          reject(error);
        }
      });
    };

    // Initialize everything
    const initialize = async () => {
      try {
        initializeWebChat();
        await loadScript();
      } catch (error) {
        console.error('Failed to initialize chat widget:', error);
      }
    };

    // Start initialization
    if (document.readyState === 'complete') {
      initialize();
    } else {
      window.addEventListener('load', initialize);
    }

    // Cleanup function
    return () => {
      window.removeEventListener('load', initialize);
      if (typeof window !== 'undefined') {
        delete window.WebChat;
      }
    };
  }, []);

  return null;
};

// Wrapped export with Error Boundary
const WrappedChatWidget = () => (
  <ChatWidgetErrorBoundary>
    <ChatWidget />
  </ChatWidgetErrorBoundary>
);

export default WrappedChatWidget;