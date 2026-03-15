import React, { useState } from "react";
import {
  ArrowLeft,
  Award,
  ShieldCheck,
  Leaf,
  Mail,
  Zap,
  History,
  TrendingDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EnsHistoryDisplay from "../../components/EnsHistoryDisplay";

const ConsumerProfile = () => {
  const navigate = useNavigate();
  const { account, ensName } = useAuth();
  const [activeTab, setActiveTab] = useState("impact");

  const tabs = [
    { id: "impact", label: "Sustainability Impact" },
    { id: "badges", label: "My Badges" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/consumer/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-cyan-400 transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="grid md:grid-cols-12 gap-12">
        {/* Profile Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 text-center">
            <div className="w-32 h-32 bg-cyan-500 rounded-[2.5rem] flex items-center justify-center text-slate-950 mx-auto mb-6 text-4xl font-black shadow-2xl shadow-cyan-500/20">
              {ensName ? ensName[0].toUpperCase() : 'C'}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{ensName || 'Consumer'}</h1>
            <p className="text-xs font-mono text-slate-600 break-all mb-6">{account}</p>
            
            <div className="space-y-4 text-left border-t border-slate-800 pt-6">
              <div className="flex items-center gap-3 text-slate-400">
                <Mail size={16} className="text-cyan-500" />
                <span className="text-sm">Verified Web3 Identity</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <ShieldCheck size={16} className="text-cyan-500" />
                <span className="text-sm">Standard Consumer Role</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-cyan-500 text-slate-950 font-bold">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={20} />
              <span className="uppercase tracking-widest text-xs">Total Offset</span>
            </div>
            <div className="text-4xl font-black mb-1">2.4 <span className="text-lg">Tons</span></div>
            <p className="text-slate-950/60 text-xs">CO2 Avoided via RECs</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="md:col-span-8 space-y-8">
          <div className="flex gap-4 border-b border-slate-800 pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-bold transition-all ${
                  activeTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'impact' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
                      <TrendingDown className="text-cyan-400 mb-4" />
                      <h4 className="font-bold text-white mb-1">Energy Retired</h4>
                      <p className="text-2xl font-black text-white">12.0 <span className="text-xs text-slate-500">MWh</span></p>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
                      <Zap className="text-amber-400 mb-4" />
                      <h4 className="font-bold text-white mb-1">Primary Source</h4>
                      <p className="text-2xl font-black text-white">Solar</p>
                  </div>
              </div>

              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800">
                  <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                    <History size={18} className="text-cyan-400" />
                    Impact History
                  </h4>
                  <div className="space-y-4">
                      {[
                        { action: 'Retired 2.0 MWh Solar', date: 'March 14, 2026', pts: '+30' },
                        { action: 'Retired 5.0 MWh Wind', date: 'March 10, 2026', pts: '+75' },
                        { action: 'Marketplace Purchase', date: 'March 05, 2026', pts: '+15' },
                      ].map((h, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                            <div>
                                <div className="text-sm font-bold text-slate-200">{h.action}</div>
                                <div className="text-[10px] text-slate-600">{h.date}</div>
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">{h.pts} GP</div>
                        </div>
                      ))}
                  </div>
              </div>

              {/* ENS History Display */}
              <EnsHistoryDisplay ensName={ensName} />
            </div>
          )}

          {activeTab === 'badges' && (
            <div className="grid sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {[
                { title: 'Early Adopter', icon: ShieldCheck, color: 'text-emerald-500' },
                { title: 'Green Pioneer', icon: Leaf, color: 'text-cyan-500' },
                { title: 'Carbon Neutral', icon: Award, color: 'text-amber-500' },
              ].map((badge, i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center group hover:border-cyan-500/30 transition-all">
                  <div className={`w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center ${badge.color} mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <badge.icon size={32} />
                  </div>
                  <h4 className="font-bold text-white text-sm">{badge.title}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsumerProfile;
