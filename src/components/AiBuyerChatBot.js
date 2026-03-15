import React, { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { Unplug } from 'lucide-react';
import { SendHorizontal } from 'lucide-react';
const RECBuyerChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isBuyer, setIsBuyer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const chatRef = useRef(null);
  
  const CA = process.env.REACT_APP_CONTRACT_ADDRESS || "0xCD0cF33577e210c6Bbd48eBafa9473123e88b15b";
  const GEMINI_API_KEY = 'AIzaSyCTqdOJSJ1QhPR1q2cey_ItEGrOIc_X8II';

  const CONTRACT_ABI = [
    "function getBuyerInfo(address buyer) view returns (tuple(bool registered, bool approved, uint256 totalBought, uint256 totalRetired))",
    "function registerBuyer()",
    "function buyTokens(uint256 id, uint256 amt, bytes32 fdHash, bytes32 ccHash)",
    "function getActiveListings() view returns (tuple(uint256 id, address seller, uint256 amount, uint256 pricePerToken, string energyType, string location, bool active, uint8 creditRatio)[])",
    "function getRECBalance(address account, string energyType) view returns (uint256)",
    "function getBuyingHistory(address buyer) view returns (tuple(address counterparty, uint256 amount, uint256 pricePerToken, string energyType, bytes32 fileverseDocHash, uint256 timestamp, bool retired, bytes32 carbonCreditHash)[])"
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
      checkBuyerStatus(address);
    } catch (error) {
      addMessage("Failed to connect wallet: " + error.message, true);
    }
  };

  const checkBuyerStatus = async (address) => {
    try {
      const buyerInfo = await contract.getBuyerInfo(address);
      setIsBuyer(buyerInfo.approved);
      if (buyerInfo.approved) {
        addMessage("Welcome approved buyer! How can I help you today?", true);
      } else if (buyerInfo.registered) {
        addMessage("Your registration is pending approval. Please wait for admin approval.", true);
      } else {
        addMessage("You need to register as a buyer first. Would you like to register now?", true);
      }
    } catch (error) {
      addMessage("Error checking buyer status: " + error.message, true);
    }
  };

  const registerAsBuyer = async () => {
    try {
      const tx = await contract.registerBuyer();
      await tx.wait();
      addMessage("Registration submitted successfully! Please wait for admin approval.", true);
      checkBuyerStatus(walletAddress);
    } catch (error) {
      addMessage("Registration failed: " + error.message, true);
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
                     Available functions: buyTokens, getActiveListings, getRECBalance, getBuyingHistory, registerBuyer.
                     Energy types allowed: solar, wind, hydro, biomass, geothermal.
                     Give answer in the language of the user.
                     
                     User request: "${userInput}"
                     
                     If the request doesn't match any function, respond with:
                     {
                       "function": "chat",
                       "response": "your helpful response about buying RECs"
                     }
                     
                     For functions, respond with format:
                     {
                       "function": "buyTokens",
                       "parameters": {
                         "id": "1",
                         "amount": "100"
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
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      const parsedResponse = JSON.parse(aiResponse.trim());

      if (parsedResponse.function === 'chat') {
        addMessage(parsedResponse.response, true);
        return null;
      }

      return processAIResponse(parsedResponse, userInput);
    } catch (error) {
      addMessage(`Error: ${error.message}. Please try again.`, true);
      return null;
    }
  };

  const processAIResponse = (aiResponse, originalInput) => {
    if (!aiResponse.function || !aiResponse.parameters) {
      throw new Error('Invalid AI response format');
    }

    const params = {
      id: aiResponse.parameters.id || aiResponse.parameters.listingId,
      amount: aiResponse.parameters.amount ? 
        aiResponse.parameters.amount.toString() : 
        '1',
      energyType: aiResponse.parameters.energyType
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
        case 'registerBuyer':
          await registerAsBuyer();
          break;
        case 'buyTokens':
          const fdHash = ethers.utils.id("AI_BUY_FILEVERSE_" + Date.now());
          const ccHash = ethers.utils.id("AI_BUY_CC_" + Date.now());
          tx = await contract.buyTokens(action.params.id, action.params.amount, fdHash, ccHash);
          break;
        case 'getActiveListings':
          const listings = await contract.getActiveListings();
          displayListings(listings);
          break;
        case 'getRECBalance':
          const balance = await contract.getRECBalance(walletAddress, action.params.energyType);
          addMessage(`Your ${action.params.energyType} REC balance: ${balance.toString()} MWh`, true);
          break;
        case 'getBuyingHistory':
          const history = await contract.getBuyingHistory(walletAddress);
          displayHistory(history);
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

  const displayListings = (listings) => {
    const listingsText = listings.map(listing => 
      `ID: ${listing.id}\nSeller: ${listing.seller}\nAmount: ${listing.amount.toString()} MWh\nPrice: ${listing.pricePerToken.toString()} Credits\nEnergy Type: ${listing.energyType}\nLocation: ${listing.location}`
    ).join('\n\n');
    addMessage(`Active Listings:\n${listingsText}`, true);
  };

  const displayHistory = (history) => {
    const historyText = history.map(tx => 
      `Seller: ${tx.counterparty}\nAmount: ${tx.amount.toString()} MWh\nPrice: ${tx.pricePerToken.toString()} Credits\nEnergy Type: ${tx.energyType}\nDate: ${new Date(tx.timestamp.toNumber() * 1000).toLocaleString()}`
    ).join('\n\n');
    addMessage(`Your Purchase History:\n${historyText}`, true);
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

    const action = await processWithGemini(input);
    if (action) {
      if (action.function === 'registerBuyer' || action.function === 'getActiveListings' || 
          action.function === 'getBalanceByEnergyType' || action.function === 'getBuyingHistory') {
        await executeTransaction(action);
      } else {
        if (!isBuyer) {
          addMessage("You need to be an approved buyer to perform this action!", true);
          return;
        }
        setPendingAction(action);
        setShowModal(true);
      }
    }
  };

  const formatEther = (wei) => {
    try {
      return parseFloat(ethers.utils.formatEther(wei));
    } catch (error) {
      return wei.toString();
    }
  };

  const formatTransactionDetails = (action) => {
    const details = [];
    
    switch (action.function) {
      case 'buyTokens':
        details.push(
          ['Listing ID', action.params.listingId],
          ['Amount', `${formatEther(action.params.amount)} RECs`]
        );
        break;
      
      case 'buyTokensByEnergyType':
        details.push(
          ['Energy Type', action.params.energyType],
          ['Amount', `${formatEther(action.params.amount)} RECs`]
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
                    <span className="text-sm text-gray-800 break-words">{value}</span>
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
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto p-1 bg-green-50">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">NOVA</h1>
        <p className='text-sm text-gray-600'>
          REC Buying AI Agent
        </p>
        {!isConnected ? (
          <button
            onClick={connectWallet}
            className="bg-green-500 mr-4 mt-4 hover:bg-green-600 text-white p-2 px-4 py-2 rounded-xl transition-colors"
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

export default RECBuyerChatbot;