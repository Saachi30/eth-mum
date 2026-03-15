import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, ShieldCheck, Trophy, Users, Zap, TrendingUp, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Community = () => {
  const { contract, account } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Since the contract leaderboard is private, we simulate the top participants 
  // for the demo, but in a real app we'd fetch from an indexer or events.
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Dummy data for top performers
      const demoData = [
        { name: 'ramesh-solar.rec.eth', address: '0x123...456', points: 1250, role: 'PRODUCER', impact: '12.5 MWh' },
        { name: 'green-energy.rec.eth', address: '0x789...012', points: 980, role: 'PRODUCER', impact: '9.8 MWh' },
        { name: 'eco-warrior.rec.eth', address: '0x345...678', points: 850, role: 'CONSUMER', impact: '8.5 MWh' },
        { name: 'solar-pioneer.rec.eth', address: '0x901...234', points: 720, role: 'PRODUCER', impact: '7.2 MWh' },
        { name: 'clean-future.rec.eth', address: '0x567...890', points: 640, role: 'CONSUMER', impact: '6.4 MWh' },
      ];
      
      // If we have an active account, add it to the list
      if (account) {
          const pts = await contract.getGreenPoints(account);
          setLeaderboard([...demoData, {
              name: 'You',
              address: account,
              points: pts.toNumber(),
              role: 'YOU',
              impact: 'Active'
          }].sort((a, b) => b.points - a.points));
      } else {
          setLeaderboard(demoData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [contract, account]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Community Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6 uppercase tracking-widest">
          <Users size={12} />
          Global Green Community
        </div>
        <h1 className="text-5xl font-black text-white mb-6">
          The <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">REC Leaderboard</span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-500 text-lg">
          Recognizing the pioneers of the decentralized clean energy economy. Every point represents a verified step towards a greener future.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12">
        {/* Leaderboard Table */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <h2 className="text-xl font-bold flex items-center gap-3">
                    <Trophy className="text-amber-400" />
                    Top Contributors
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search ENS name..."
                        className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500/50"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] text-slate-600 uppercase font-black tracking-widest border-b border-slate-800">
                            <th className="px-8 py-6">Rank</th>
                            <th className="px-8 py-6">Participant</th>
                            <th className="px-8 py-6">Role</th>
                            <th className="px-8 py-6">Impact</th>
                            <th className="px-8 py-6 text-right">GreenPoints</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {leaderboard.map((user, i) => (
                            <tr key={i} className={`group hover:bg-emerald-500/5 transition-colors ${user.role === 'YOU' ? 'bg-emerald-500/10' : ''}`}>
                                <td className="px-8 py-6">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                        i === 0 ? 'bg-amber-400 text-slate-950' : 
                                        i === 1 ? 'bg-slate-300 text-slate-950' :
                                        i === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'
                                    }`}>
                                        {i + 1}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all font-bold">
                                            {user.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200">{user.name}</div>
                                            <div className="text-[10px] text-slate-600 font-mono">{user.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                        user.role === 'PRODUCER' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-cyan-500/10 text-cyan-500'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-sm text-slate-400">
                                    {user.impact}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="text-xl font-black text-white">{user.points}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-xl shadow-emerald-500/20 text-slate-950">
                <h3 className="text-2xl font-black mb-4">Earning Rewards</h3>
                <p className="text-slate-950/80 mb-6 font-medium">
                    GreenPoints are awarded for every action that supports the clean energy ecosystem.
                </p>
                <div className="space-y-4">
                    {[
                        { label: 'Minting RECs', pts: '+10 / MWh' },
                        { label: 'Trading (Sell)', pts: '+5 / MWh' },
                        { label: 'Trading (Buy)', pts: '+3 / MWh' },
                        { label: 'Retiring RECs', pts: '+15 / MWh' },
                    ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-950/10">
                            <span className="font-bold">{item.label}</span>
                            <span className="bg-slate-950 text-white px-3 py-1 rounded-lg text-xs font-black">{item.pts}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 text-center">
                <ShieldCheck className="mx-auto text-emerald-400 mb-4" size={48} />
                <h4 className="text-xl font-bold text-white mb-2">Verifiable Impact</h4>
                <p className="text-sm text-slate-500 leading-relaxed">
                    All leaderboard positions are calculated on-chain. Identities are linked via ENS subdomains, ensuring a transparent and human-centric community.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
