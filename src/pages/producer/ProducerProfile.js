import React, { useState } from "react";
import {
  ArrowLeft,
  Trophy,
  Award,
  ShieldCheck,
  Zap,
  Mail,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import greencerti from "../../assets/greencerti.webp";
import EnsHistoryDisplay from "../../components/EnsHistoryDisplay";

const ProducerProfile = () => {
  const navigate = useNavigate();
  const { account, ensName, userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState("achievements");

  const tabs = [
    { id: "achievements", label: "Achievements" },
    { id: "certificates", label: "Certificates" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/producer/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-400 transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      <div className="grid md:grid-cols-12 gap-12">
        {/* Profile Sidebar */}
        <div className="md:col-span-4 space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 text-center">
            <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-slate-950 mx-auto mb-6 text-4xl font-black shadow-2xl shadow-emerald-500/20">
              {ensName ? ensName[0].toUpperCase() : 'P'}
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{ensName || 'Producer'}</h1>
            <p className="text-xs font-mono text-slate-600 break-all mb-6">{account}</p>
            
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3 text-slate-400">
                <Mail size={16} className="text-emerald-500" />
                <span className="text-sm">{userInfo?.gst || 'Verified Identity'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={16} className="text-emerald-500" />
                <span className="text-sm">{userInfo?.location || 'Remote'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <Zap size={16} className="text-emerald-500" />
                <span className="text-sm">{userInfo?.energyTypes || 'Solar, Wind'}</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-emerald-500 text-slate-950 font-bold">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={20} />
              <span className="uppercase tracking-widest text-xs">Total Impact</span>
            </div>
            <div className="text-4xl font-black mb-1">12.5 <span className="text-lg">MWh</span></div>
            <p className="text-slate-950/60 text-xs">Green Energy Contributed</p>
          </div>

          {/* ENS History Display in Sidebar */}
          <EnsHistoryDisplay ensName={ensName} />
        </div>

        {/* Profile Content */}
        <div className="md:col-span-8 space-y-8">
          <div className="flex gap-4 border-b border-slate-800 pb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-bold transition-all ${
                  activeTab === tab.id ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'achievements' && (
            <div className="grid sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {[
                { title: 'Early Adopter', date: 'March 2026', desc: 'Joined as a first-gen producer.' },
                { title: 'First 10 MWh', date: 'March 2026', desc: 'Reached a major generation milestone.' },
                { title: 'ZK Verified', date: 'March 2026', desc: 'All generation data is zero-knowledge proven.' },
              ].map((ach, i) => (
                <div key={i} className="p-6 rounded-3xl bg-slate-900 border border-slate-800 group hover:border-emerald-500/30 transition-all">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                    <Award size={24} />
                  </div>
                  <h4 className="font-bold text-white mb-1">{ach.title}</h4>
                  <p className="text-xs text-slate-500 mb-2">{ach.date}</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{ach.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-slate-800 flex items-center justify-between group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                    <ShieldCheck size={32} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-1">Producer Verification</h4>
                    <p className="text-sm text-slate-500">Issued by RECreate Governance</p>
                  </div>
                </div>
                <a 
                  href={greencerti} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-emerald-400 hover:border-emerald-400 transition-all"
                >
                  <ExternalLink size={24} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProducerProfile;
