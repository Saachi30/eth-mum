import React, { useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { Tag, Plus, Loader2, Coins, Globe } from 'lucide-react';
import { useMQTTContext } from '../context/MQTTContext';
import { useAuth } from '../context/AuthContext';
import { syncActionToEns } from '../utils/ensHelper';

const ListTokens = ({ contract, account }) => {
  const { publish } = useMQTTContext();
  const { ensName } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    price: '',
    energyType: 'solar',
    creditRatio: '20'
  });
  const [loading, setLoading] = useState(false);
  const [syncingEns, setSyncingEns] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return;
    
    setLoading(true);
    try {
      const balance = await contract.getRECBalance(account, formData.energyType);
      const listAmount = ethers.BigNumber.from(formData.amount);
      if (balance.lt(listAmount)) {
          toast.error(`Insufficient balance.`);
          setLoading(false);
          return;
      }

      const pricePerToken = Math.floor(Number(formData.price));
      const creditRatio = parseInt(formData.creditRatio);

      const tx = await contract.listTokens(
        listAmount,
        pricePerToken,
        formData.energyType,
        creditRatio
      );
      
      toast.info("Creating on-chain listing...");
      await tx.wait();
      toast.success(`Listed ${formData.amount} MWh for sale!`);

      // Background Sync to ENS
      if (ensName) {
        setSyncingEns(true);
        syncActionToEns(ensName, account, "listing_history", {
            type: "LIST",
            amount: formData.amount,
            price: formData.price,
            energyType: formData.energyType,
            txHash: tx.hash
        }).then(() => {
            toast.success("ENS Profile updated!");
        }).catch(err => {
            console.error("ENS sync failed:", err);
        }).finally(() => {
            setSyncingEns(false);
        });
      }
      
      publish("energy/event1", "1");
      setFormData({ amount: '', price: '', energyType: 'solar', creditRatio: '20' });
    } catch (error) {
      console.error("Listing Error:", error);
      toast.error(error.reason || error.message || "Listing failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
          <Tag size={20} />
        </div>
        <h2 className="text-xl font-bold">List RECs for Sale</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Energy Type</label>
          <select 
            value={formData.energyType}
            onChange={(e) => setFormData({...formData, energyType: e.target.value})}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="solar">Solar</option>
            <option value="wind">Wind</option>
            <option value="hydro">Hydro</option>
            <option value="biomass">Biomass</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Amount (MWh)</label>
            <input 
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="1.0"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Price (Credits)</label>
            <input 
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="100"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-500/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Credit Reward Ratio ({formData.creditRatio}%)</label>
          <input 
            type="range"
            min="0"
            max="100"
            step="5"
            value={formData.creditRatio}
            onChange={(e) => setFormData({...formData, creditRatio: e.target.value})}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Coins size={12} className="text-cyan-400" />
            Total Listing Value: {formData.amount * formData.price || 0} Credits
        </div>

        <button 
          type="submit"
          disabled={loading || syncingEns}
          className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-extrabold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="animate-spin" /> : syncingEns ? <><Globe className="animate-pulse" size={20} /> Syncing ENS...</> : <Plus size={20} />}
          Create Public Listing
        </button>
      </form>
    </div>
  );
};

export default ListTokens;
