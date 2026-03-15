import React, { useState, useEffect, useCallback } from 'react';
import { Globe, Loader2, Calendar, Tag, ShoppingCart, RefreshCw } from 'lucide-react';
import { getEnsTextRecord } from '../utils/ensHelper';

const EnsHistoryDisplay = ({ ensName }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEnsHistory = useCallback(async () => {
        if (!ensName) return;
        setLoading(true);
        try {
            const [buyData, listData] = await Promise.all([
                getEnsTextRecord(ensName, "buy_history"),
                getEnsTextRecord(ensName, "listing_history")
            ]);

            let combined = [];
            
            try {
                if (buyData) {
                    const parsed = JSON.parse(buyData);
                    if (Array.isArray(parsed)) combined = [...combined, ...parsed];
                }
            } catch (e) { console.error("Error parsing ENS buy history", e); }

            try {
                if (listData) {
                    const parsed = JSON.parse(listData);
                    if (Array.isArray(parsed)) combined = [...combined, ...parsed];
                }
            } catch (e) { console.error("Error parsing ENS listing history", e); }

            // Sort by timestamp descending
            combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(combined);
        } catch (error) {
            console.error("Error fetching ENS history:", error);
        } finally {
            setLoading(false);
        }
    }, [ensName]);

    useEffect(() => {
        fetchEnsHistory();
    }, [fetchEnsHistory]);

    if (!ensName) return null;

    return (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-white flex items-center gap-2">
                    <Globe size={18} className="text-cyan-400" />
                    On-Chain ENS Activity
                </h4>
                <button 
                    onClick={fetchEnsHistory}
                    disabled={loading}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-cyan-400 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin text-cyan-500" />
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm italic">
                    No ENS text records found for this profile.
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    item.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                    {item.type === 'BUY' ? <ShoppingCart size={18} /> : <Tag size={18} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-200">
                                        {item.type === 'BUY' ? 'Purchased' : 'Listed'} {item.amount} MWh {item.energyType}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        <Calendar size={10} />
                                        {new Date(item.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono text-slate-400">
                                    {item.txHash ? `${item.txHash.slice(0, 6)}...${item.txHash.slice(-4)}` : 'N/A'}
                                </div>
                                <div className="text-[10px] text-slate-600 uppercase font-bold">Transaction</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="mt-6 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                    This history is stored directly in your <b>ENS Text Records</b> on Ethereum Sepolia. 
                    It remains visible even if the marketplace UI changes!
                </p>
            </div>
        </div>
    );
};

export default EnsHistoryDisplay;
