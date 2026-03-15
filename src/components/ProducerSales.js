import React, { useState, useEffect } from 'react';
import { History, TrendingUp, Calendar, Zap, ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { getFileverseUrl } from '../utils/fileverseHelper';
import { toast } from 'react-toastify';

const ProducerSales = ({ contract, account }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const data = await contract.getSellingHistory(account);
      setHistory(data.map((h, i) => ({
        id: i,
        buyer: h.counterparty,
        amount: h.amount.toString(),
        price: h.pricePerToken.toString(),
        energyType: h.energyType,
        carbonCreditHash: h.carbonCreditHash,
        fileverseDocHash: h.fileverseDocHash,
        timestamp: (h.timestamp.toNumber ? h.timestamp.toNumber() : Number(h.timestamp)) * 1000
      })).reverse());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [contract, account]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Sales History</h2>
        </div>
        <button onClick={fetchHistory} className="text-xs text-slate-500 hover:text-emerald-400">Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No sales yet. Your listings will appear here once purchased.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                    <Zap size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider">{item.energyType}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-500 font-bold uppercase">
                            {item.amount} MWh
                        </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">
                        Buyer: {item.buyer.slice(0, 12)}...{item.buyer.slice(-8)}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Calendar size={10} />
                            {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                            <ShieldCheck size={10} />
                            ZK-Verified
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between">
                    <div className="text-right">
                        <div className="text-xl font-bold text-emerald-400">+{item.price * item.amount}</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter text-right">Credits Earned</div>
                    </div>
                    
                    <button 
                        onClick={() => {
                            const url = getFileverseUrl(item.fileverseDocHash);
                            if (url) window.open(url, '_blank');
                            else toast.info("No private receipt available.");
                        }}
                        className="mt-4 p-2 bg-slate-900 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors border border-slate-800 hover:border-emerald-500/30 self-end" 
                        title="View Private Receipt"
                    >
                        <ExternalLink size={14} />
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProducerSales;
