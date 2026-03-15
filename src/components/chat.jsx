import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, ShieldCheck, User, Zap } from 'lucide-react';
import { toast } from 'react-toastify';

const ChatComponent = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { account, ensName } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Simulated P2P Messaging (In a real app, use XMTP or similar)
  useEffect(() => {
    const dummyMessages = [
      { id: 1, sender: userId, text: "Hi, I saw your solar REC listing. Is the price negotiable?", timestamp: Date.now() - 3600000 },
      { id: 2, sender: account, text: "Hello! The price is based on the current market average, but I can offer a small discount for bulk purchases.", timestamp: Date.now() - 1800000 },
    ];
    setMessages(dummyMessages);
  }, [userId, account]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: messages.length + 1,
      sender: account,
      text: newMessage,
      timestamp: Date.now()
    };

    setMessages([...messages, msg]);
    setNewMessage('');
    toast.success("Message sent securely");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-120px)] flex flex-col">
      {/* Chat Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-[2rem] p-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400">
                <User size={20} />
             </div>
             <div>
                <div className="font-bold text-white text-sm">{userId.slice(0, 10)}...</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <ShieldCheck size={10} className="text-emerald-500" />
                    Verified Identity
                </div>
             </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Zap size={10} className="text-emerald-400" />
            P2P Encrypted Channel
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 bg-slate-950/50 border-x border-slate-800 p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === account ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
              msg.sender === account 
              ? 'bg-emerald-500 text-slate-950 font-medium rounded-tr-none' 
              : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
            }`}>
              {msg.text}
              <div className={`text-[8px] mt-2 ${msg.sender === account ? 'text-slate-900/60' : 'text-slate-600'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-b-[2rem] p-4 shadow-2xl">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text" 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-3 px-6 text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
          <button 
            type="submit"
            className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
