import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowRight, Shield, Database, Lock } from 'lucide-react';
import { useMQTTContext } from '../context/MQTTContext';

const Home = () => {
  const navigate = useNavigate();
  const { account, connectWallet } = useAuth();
  const { publish } = useMQTTContext();

  const handleGetStarted = async () => {
    if (!account) {
      const addr = await connectWallet();
      if (addr) navigate('/register');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hidden Setup Button */}
      <button 
        onClick={() => publish("energy/init", "1")}
        className="fixed bottom-4 left-4 opacity-0 hover:opacity-10 transition-opacity z-50 text-[8px] text-slate-800"
      >
        Initial Setup
      </button>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-cyan-500/20 rounded-full blur-[128px] animate-pulse delay-700"></div>

        <div className="max-w-7xl mx-auto px-4 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
            <Shield size={12} />
            ZK-Verified Peer-to-Peer Marketplace
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            Decentralizing the <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Clean Energy Economy
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            A P2P marketplace where small renewable energy producers sell verified energy credits 
            directly to buyers. No brokers, no minimums, just pure green energy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              Get Started Now
              <ArrowRight size={20} />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 py-8 px-4 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
            {[
              { label: 'Verified Producers', value: '1.2k+' },
              { label: 'Energy Traded', value: '450 MWh' },
              { label: 'ZK Proofs Generated', value: '8.4k' },
              { label: 'ENS Identities', value: '2.1k' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built on the Trustless Web</h2>
            <p className="text-slate-400">Powered by ZK Proofs, ENS, and Fileverse</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">ZK-Verification</h3>
              <p className="text-slate-400 leading-relaxed">
                Prove your energy generation using Reclaim Protocol without exposing private smart meter data.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <Database size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Private Receipts</h3>
              <p className="text-slate-400 leading-relaxed">
                All trade receipts and certificates are stored privately using Fileverse, with hashes anchored on-chain.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">ENS Identity</h3>
              <p className="text-slate-400 leading-relaxed">
                Interact as a human, not an address. Every participant claims their unique .eth subdomain.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
