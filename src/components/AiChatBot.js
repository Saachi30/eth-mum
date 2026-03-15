import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Unplug } from 'lucide-react';
import { SendHorizontal } from 'lucide-react';


const RECChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isProducer, setIsProducer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const chatRef = useRef(null);
  
  const CA = process.env.REACT_APP_CONTRACT_ADDRESS || "0xCD0cF33577e210c6Bbd48eBafa9473123e88b15b";
  const GEMINI_API_KEY = 'AIzaSyCTqdOJSJ1QhPR1q2cey_ItEGrOIc_X8II';

  const CONTRACT_ABI = [
    "function getProducerInfo(address producer) view returns (tuple(string gst, string location, string energyTypes, bool verified, uint256 totalMinted))",
    "function mintTokens(uint256 amt, string calldata eType)",
    "function retireTokens(uint256 amt, string calldata eType)",
    "function listTokens(uint256 amt, uint256 price, string calldata eType, uint8 creditRatio)",
    "function cancelListing(uint256 id)",
    "function getRECBalance(address acct, string calldata eType) view returns (uint256)"
  ];

  const provider = window.ethereum ? new ethers.providers.Web3Provider(window.ethereum) : null;
  const signer = provider?.getSigner();
  const contract = CA && signer ? new ethers.Contract(CA, CONTRACT_ABI, signer) : null;

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (text, isBot = false) => {
    setMessages(prev => [...prev, { text, isBot, timestamp: Date.now() }]);
  };
  const connectWallet = async () => {
    try {
      if (!provider) {
        addMessage("Please install MetaMask!", true);
        return;
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = await signer.getAddress();
      setWalletAddress(address);
      setIsConnected(true);
      checkProducerStatus(address);
    } catch (error) {
      addMessage("Failed to connect wallet: " + error.message, true);
    }
  };

  const checkProducerStatus = async (address) => {
    try {
      const producerInfo = await contract.getProducerInfo(address);
      setIsProducer(producerInfo.verified);
      if (producerInfo.verified) {
        addMessage("Welcome verified producer! How can I help you today?", true);
      } else {
        addMessage("You need to be a verified producer to use this interface.", true);
      }
    } catch (error) {
      addMessage("Error checking producer status: " + error.message, true);
    }
  };

  const processWithGemini = async (userInput) => {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an AI assistant for a blockchain REC (Renewable Energy Certificate) trading platform.
                     Parse this user request and respond with a JSON object containing 'function' and 'parameters'.
                     Available functions: mintTokens, retireTokens, listTokens, cancelListing, getRECBalance.
                     Energy types allowed: solar, wind, hydro, biomass. Give answer in the language of the user.
                     
                     User request: "${userInput}"
                     
                     If the request doesn't match any function, respond with:
                     {
                       "function": "chat",
                       "response": "your helpful response about RECs"
                     }
                     
                     For functions, respond with format:
                     {
                       "function": "listTokens",
                       "parameters": {
                         "amount": "100",
                         "price": "50",
                         "energyType": "solar",
                         "creditRatio": "20"
                       }
                     }`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topP: 1,
            topK: 1,
            maxOutputTokens: 1000,
          },
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error Details:', errorData);
        throw new Error(`API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected API response structure:', data);
        throw new Error('Invalid response structure from Gemini API');
      }

      const aiResponse = data.candidates[0].content.parts[0].text;

      try {
        const parsedResponse = JSON.parse(aiResponse.trim());
        
        if (parsedResponse.function === 'chat') {
          addMessage(parsedResponse.response, true);
          return null;
        }
        
        return processAIResponse(parsedResponse, userInput);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    } catch (error) {
      console.error('AI Processing error:', error);
      addMessage(`Error: ${error.message}. Please try again.`, true);
      return null;
    }
  };

  const processAIResponse = (aiResponse, originalInput) => {
    if (!aiResponse.function || !aiResponse.parameters) {
      throw new Error('Invalid AI response format');
    }

    const params = {
      amount: aiResponse.parameters.amount ? aiResponse.parameters.amount.toString() : '1',
      energyType: aiResponse.parameters.energyType || 'solar',
      price: aiResponse.parameters.price ? aiResponse.parameters.price.toString() : '1',
      creditRatio: aiResponse.parameters.creditRatio ? aiResponse.parameters.creditRatio.toString() : '20',
      id: aiResponse.parameters.id || aiResponse.parameters.listingId
    };

    return {
      function: aiResponse.function,
      params: params
    };
  };


  const executeTransaction = async (action) => {
    try {
      let tx;
      switch (action.function) {
        case 'mintTokens':
          tx = await contract.mintTokens(action.params.amount, action.params.energyType);
          break;
        case 'retireTokens':
          tx = await contract.retireTokens(action.params.amount, action.params.energyType);
          break;
        case 'listTokens':
          tx = await contract.listTokens(action.params.amount, action.params.price, action.params.energyType, action.params.creditRatio);
          break;
        case 'cancelListing':
          tx = await contract.cancelListing(action.params.id);
          break;
        case 'getRECBalance':
          const balance = await contract.getRECBalance(walletAddress, action.params.energyType);
          addMessage(`Your ${action.params.energyType} REC balance: ${balance.toString()} MWh`, true);
          break;
        default:
          throw new Error('Unknown function');
      }
      
      if (tx) {
        const receipt = await tx.wait();
        addMessage(`Transaction successful! Hash: ${receipt.transactionHash}`, true);
      }
    } catch (error) {
      addMessage("Transaction failed: " + error.message, true);
    }
    setShowModal(false);
    setPendingAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage(input, false);
    setInput('');

    if (!isConnected) {
      addMessage("Please connect your wallet first!", true);
      return;
    }

    if (!isProducer) {
      addMessage("Only verified producers can use this interface!", true);
      return;
    }

    const action = await processWithGemini(input);
    if (action) {
      if (action.function === 'getRECBalance') {
        await executeTransaction(action);
      } else {
        setPendingAction(action);
        setShowModal(true);
      }
    }
  };

  const formatValue = (val) => {
    return val?.toString() || '0';
  };

  const formatTransactionDetails = (action) => {
    const details = [];
    
    switch (action.function) {
      case 'mintTokens':
        details.push(
          ['Amount', `${formatValue(action.params.amount)} MWh`],
          ['Energy Type', action.params.energyType]
        );
        break;
      
      case 'retireTokens':
        details.push(
          ['Amount', `${formatValue(action.params.amount)} MWh`],
          ['Energy Type', action.params.energyType]
        );
        break;
      
      case 'listTokens':
        details.push(
          ['Amount', `${formatValue(action.params.amount)} MWh`],
          ['Price', `${formatValue(action.params.price)} Credits`],
          ['Energy Type', action.params.energyType],
          ['Credit Ratio', `${action.params.creditRatio}%`]
        );
        break;
      
      case 'cancelListing':
        details.push(
          ['Listing ID', action.params.id]
        );
        break;
      
      default:
        details.push(['Details', 'Unknown transaction type']);
    }
    
    return details;
  };

  const renderModal = () => {
    if (!showModal || !pendingAction) return null;

    const details = formatTransactionDetails(pendingAction);
    const functionName = pendingAction.function
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Confirm Transaction</h2>
          <div className="mb-6">
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                {functionName}
              </h3>
              <div className="space-y-2">
                {details.map(([label, value], index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <span className="text-sm font-medium text-gray-600">{label}:</span>
                    <span className="text-sm text-gray-800 break-words">
                      {typeof value === 'string' && value.startsWith('0x') 
                        ? `${value.slice(0, 6)}...${value.slice(-4)}`
                        : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => executeTransaction(pendingAction)}
              className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto p-4 bg-green-50">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">AVA</h1>
        <p className='text-sm text-gray-600'>
          REC Producer AI Agent
        </p>
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="bg-green-500 mr-4 mt-4 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Unplug />
          </button>
        ) : (
          <span className="text-sm text-gray-600 bg-gray-200 px-4 py-2 rounded-lg">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        )}
      </div>

      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto mb-4 bg-white rounded-lg shadow p-4 space-y-4"
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.isBot ? 'bg-gray-100' : 'bg-blue-500 text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <SendHorizontal />

        </button>
      </form>

      {renderModal()}
    </div>
  );
};

export default RECChatbot;
