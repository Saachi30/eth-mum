import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Listings from "../../components/Listings";
import BuyerHistory from "../../components/BuyerHistory";
import { ShoppingBag, History, Leaf, TrendingDown, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ConsumerDashboard = () => {
  const { account, contract, ensName } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [dummyCredits, setDummyCredits] = useState('0');
  const [greenPoints, setGreenPoints] = useState('0');

  const fetchBalances = useCallback(async () => {
    if (contract && account) {
      try {
        const credits = await contract.dummyCredits(account);
        const points = await contract.getCarbonCredits(account);
        setDummyCredits(credits.toString());
        setGreenPoints(points.toString());
      } catch (e) {
        console.error(e);
      }
    }
  }, [contract, account]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const tabs = [
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'history', label: 'My RECs', icon: History },
    { id: 'impact', label: 'Environmental Impact', icon: Leaf },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              Consumer Node
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Welcome back, <span className="text-cyan-400">{ensName || 'Consumer'}</span>
          </h1>
          <p className="text-slate-500">Browse, purchase, and retire renewable energy credits to offset your footprint.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Carbon Credits</div>
              <div className="text-xl font-bold text-white">{greenPoints}</div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
              <TrendingDown size={24} />
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Balance</div>
              <div className="text-xl font-bold text-white">{dummyCredits} <span className="text-xs text-slate-600 font-normal">Credits</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Tabs */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'marketplace' && (
              <motion.div
                key="marketplace"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Listings contract={contract} account={account} />
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <BuyerHistory contract={contract} account={account} />
              </motion.div>
            )}

            {activeTab === 'impact' && (
              <motion.div
                key="impact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid md:grid-cols-2 gap-8"
              >
                 <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-6">
                        <Leaf size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Carbon Offset</h3>
                    <div className="text-4xl font-extrabold text-emerald-400 mb-2">2.4 <span className="text-lg text-slate-600 font-normal">Tons</span></div>
                    <p className="text-sm text-slate-500">Equivalent to planting 40 trees this year.</p>
                 </div>
                 <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto mb-6">
                        <TrendingDown size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Total Retired</h3>
                    <div className="text-4xl font-extrabold text-cyan-400 mb-2">12 <span className="text-lg text-slate-600 font-normal">RECs</span></div>
                    <p className="text-sm text-slate-500">Verified on-chain via ZK Proofs.</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ConsumerDashboard;
