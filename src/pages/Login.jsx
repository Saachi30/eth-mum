import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowRight } from 'lucide-react';

const Login = () => {
  const { account, role, connectWallet, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (account) {
      if (role === 'PRODUCER') navigate('/producer/dashboard');
      else if (role === 'BUYER') navigate('/consumer/dashboard');
      else navigate('/register');
    }
  }, [account, role, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
            <Wallet size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-slate-400">Connect your wallet to access the P2P REC Marketplace</p>
        </div>

        <button
          onClick={connectWallet}
          disabled={loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Wallet size={20} />
              Connect MetaMask
            </>
          )}
        </button>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500 mb-4">New to the platform?</p>
          <button 
            onClick={() => navigate('/register')}
            className="text-emerald-400 font-semibold hover:text-emerald-300 flex items-center justify-center gap-1 mx-auto group"
          >
            Create your ENS Identity
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
