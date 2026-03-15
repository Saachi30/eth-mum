import React, { useState, useEffect } from 'react';
import { History, Flame, ExternalLink, Calendar, Zap, ShieldCheck, Loader2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import { getFileverseUrl } from '../utils/fileverseHelper';

const BuyerHistory = ({ contract, account }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retiringId, setRetiringId] = useState(null);
  // Map of energyType → { recBal, erc20Bal } for pre-flight checks
  const [balances, setBalances] = useState({});

  const fetchHistory = async () => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const data = await contract.getBuyingHistory(account);
      const mapped = data.map((h, i) => ({
        id: i,
        seller: h.counterparty,
        amount: h.amount.toString(),
        price: h.pricePerToken.toString(),
        energyType: h.energyType,
        carbonCreditHash: h.carbonCreditHash,
        fileverseDocHash: h.fileverseDocHash,
        timestamp: (h.timestamp.toNumber ? h.timestamp.toNumber() : Number(h.timestamp)) * 1000,
        retired: h.retired
      })).reverse();
      setHistory(mapped);

      // Pre-fetch both balance checks for each unique energyType
      const uniqueTypes = [...new Set(mapped.map(h => h.energyType))];
      const balMap = {};
      await Promise.all(uniqueTypes.map(async (eType) => {
        const [recBal, erc20Bal] = await Promise.all([
          contract.getRECBalance(account, eType),
          contract.balanceOf(account),
        ]);
        balMap[eType] = {
          recBal: recBal.toString(),
          erc20Bal: erc20Bal.toString(),
        };
      }));
      setBalances(balMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [contract, account]);

  const handleRetire = async (energyType, amount) => {
    if (!contract) return;

    // ── Pre-flight: check both conditions retireTokens requires ──────────
    try {
      const [recBal, erc20Bal] = await Promise.all([
        contract.getRECBalance(account, energyType),
        contract.balanceOf(account),
      ]);
      const recBalN = Number(recBal.toString());
      const erc20BalN = Number(erc20Bal.toString());
      const amtN = Number(amount);

      if (recBalN < amtN) {
        toast.error(
          `Insufficient REC balance for ${energyType}. Have: ${recBalN} MWh, Need: ${amtN} MWh.`
        );
        return;
      }
      if (erc20BalN < amtN) {
        toast.error(
          `Cannot retire: your ERC-20 token balance is ${erc20BalN} but ${amtN} are required for burning. ` +
          `RECs acquired via purchase do not carry transferable tokens in this contract version. ` +
          `Only RECs minted directly by a producer can be retired.`
        );
        return;
      }
    } catch (e) {
      console.error('Pre-flight check failed', e);
      toast.error('Could not verify on-chain balances. Please try again.');
      return;
    }

    setRetiringId(energyType + amount);
    try {
      const tx = await contract.retireTokens(amount, energyType);
      toast.info(`Retiring ${amount} MWh of ${energyType} RECs...`);
      await tx.wait();
      toast.success('RECs successfully retired! Carbon offset claimed.');
      fetchHistory();
    } catch (error) {
      console.error(error);
      const reason = error?.data?.message || error?.reason || error?.message || 'Retirement failed.';
      toast.error(reason);
    } finally {
      setRetiringId(null);
    }
  };

  // Determine retire eligibility for a history item
  const getRetireState = (item) => {
    if (item.retired) return { canRetire: false, reason: 'Already retired' };
    const bal = balances[item.energyType];
    if (!bal) return { canRetire: false, reason: 'Checking balances…' };
    const recBalN = Number(bal.recBal);
    const erc20BalN = Number(bal.erc20Bal);
    const amtN = Number(item.amount);
    if (recBalN < amtN)
      return { canRetire: false, reason: `REC balance too low (have ${recBalN} MWh)` };
    if (erc20BalN < amtN)
      return {
        canRetire: false,
        reason: `ERC-20 balance is 0 — purchased RECs cannot be burned in this contract. Only producer-minted RECs are burnable.`,
      };
    return { canRetire: true, reason: null };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
            <History size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">Purchase History</h2>
        </div>
        <button onClick={fetchHistory} className="text-xs text-slate-500 hover:text-cyan-400">Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-cyan-500" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          No purchases yet. Start trading in the marketplace!
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const { canRetire, reason } = getRetireState(item);
            const retireKey = item.energyType + item.amount;
            return (
            <div key={item.id} className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400">
                    <Zap size={20} className={item.energyType === 'solar' ? 'text-amber-400' : 'text-blue-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white uppercase tracking-wider">{item.energyType}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-500 font-bold uppercase">
                            {item.amount} MWh
                        </span>
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono mt-1">
                        Seller: {item.seller.slice(0, 12)}...{item.seller.slice(-8)}
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
                        <div className="text-lg font-bold text-white">{item.price * item.amount}</div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Total Credits</div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => {
                                const url = getFileverseUrl(item.fileverseDocHash);
                                if (url) window.open(url, '_blank');
                                else toast.info("No private receipt available for this trade.");
                            }}
                            className="p-2 bg-slate-900 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors border border-slate-800 hover:border-cyan-500/30" 
                            title="View Private Receipt"
                        >
                            <ExternalLink size={14} />
                        </button>

                        <div className="flex flex-col items-end gap-1">
                          <button 
                              disabled={!canRetire || retiringId === retireKey}
                              onClick={() => handleRetire(item.energyType, item.amount)}
                              title={reason || 'Retire this REC to claim carbon offset'}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                  item.retired
                                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                  : canRetire
                                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-slate-950 cursor-pointer'
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              }`}
                          >
                              {retiringId === retireKey
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Flame size={14} />}
                              {item.retired ? 'Retired' : 'Retire REC'}
                          </button>
                          {!item.retired && !canRetire && reason && (
                            <div className="flex items-start gap-1 max-w-xs">
                              {reason.includes('ERC-20') 
                                ? <AlertCircle size={10} className="text-amber-400 shrink-0 mt-0.5" />
                                : <Info size={10} className="text-slate-500 shrink-0 mt-0.5" />}
                              <span className="text-[9px] text-slate-500 leading-tight">{reason}</span>
                            </div>
                          )}
                        </div>
                    </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BuyerHistory;
