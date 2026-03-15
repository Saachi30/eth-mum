import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import RECBalance from '../../components/RECBalance';
import CombinedEnergyVerifier from '../../components/CombinedEnergyVerifier';
import ListTokensForm from '../../components/ListTokens';
import ActiveListings from '../../components/ActiveListings';
import ProducerSales from '../../components/ProducerSales';
import { Zap, LayoutDashboard, List, History, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProducerDashboard = () => {
    const { account, contract, ensName, userInfo } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'mint', label: 'Mint RECs', icon: ShieldCheck },
        { id: 'listings', label: 'My Listings', icon: List },
        { id: 'history', label: 'Sales History', icon: History },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Dashboard Header */}
            <div className="mb-12">
                <div className="flex items-center gap-4 mb-2">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        Producer Node
                    </div>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-2">
                    Welcome back, <span className="text-emerald-400">{ensName || 'Producer'}</span>
                </h1>
                <p className="text-slate-500">Manage your renewable energy credits and track your impact on the grid.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar - Navigation */}
                <div className="lg:col-span-3 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${
                                activeTab === tab.id 
                                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' 
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                            }`}
                        >
                            <tab.icon size={20} />
                            {tab.label}
                        </button>
                    ))}

                    <div className="mt-8 p-6 rounded-3xl bg-slate-900/50 border border-slate-800/50">
                        <div className="flex items-center gap-2 text-emerald-400 mb-4">
                            <TrendingUp size={16} />
                            <span className="text-xs font-bold uppercase">Market Rate</span>
                        </div>
                        <div className="text-2xl font-bold text-white mb-1">0.024 ETH</div>
                        <div className="text-[10px] text-slate-500">Per MWh (Avg. Solar)</div>
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div 
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <RECBalance contract={contract} account={account} />
                                    <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-center">
                                        <div className="text-slate-500 text-sm mb-1">Total Minted</div>
                                        <div className="text-4xl font-bold text-white mb-4">{userInfo?.totalMinted?.toString() || '0'} <span className="text-lg text-slate-600 font-normal">MWh</span></div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[70%]"></div>
                                        </div>
                                    </div>
                                </div>
                                <ActiveListings contract={contract} account={account} />
                            </motion.div>
                        )}

                        {activeTab === 'mint' && (
                            <motion.div 
                                key="mint"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid md:grid-cols-2 gap-8"
                            >
                                <CombinedEnergyVerifier contract={contract} />
                                <ListTokensForm contract={contract} account={account} />
                            </motion.div>
                        )}

                        {activeTab === 'listings' && (
                            <motion.div 
                                key="listings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <ActiveListings contract={contract} account={account} />
                            </motion.div>
                        )}

                        {activeTab === 'history' && (
                            <motion.div 
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <ProducerSales contract={contract} account={account} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ProducerDashboard;
