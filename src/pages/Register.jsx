import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Building2, Check, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'react-toastify';

const Register = () => {
  const { account, ensName, contract, updateUserInfo, role: existingRole } = useAuth();
  const navigate = useNavigate();
  
  const [role, setRole] = useState(null); // 1: PRODUCER, 2: BUYER
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && existingRole) {
      if (existingRole === 'PRODUCER') navigate('/producer/dashboard');
      else navigate('/consumer/dashboard');
    }
  }, [account, existingRole, navigate]);

  const handleFinalizeRole = async () => {
    if (!contract || !role) return;
    
    setLoading(true);
    try {
      // Register specific Role details
      if (role === 1) { // PRODUCER
        const tx = await contract.registerProducer("VERIFIED-ZK", "Remote-Solar-Farm", "Solar");
        toast.info("Registering Producer Role on Base...");
        await tx.wait();
      } else { // BUYER
        const tx = await contract.registerBuyer();
        toast.info("Registering Consumer Role on Base...");
        await tx.wait();
        try {
            await (await contract.approveBuyer(account)).wait();
        } catch (e) { console.log("Auto-approval skipped"); }
      }

      toast.success("Role registered successfully!");
      await updateUserInfo();
      
      if (role === 1) navigate('/producer/dashboard');
      else navigate('/consumer/dashboard');

    } catch (error) {
      console.error(error);
      toast.error("Role registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (!account) return <div className="text-center py-20">Please connect wallet first.</div>;

  if (!ensName) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md p-10 rounded-[2.5rem] bg-slate-900 border border-slate-800 text-center shadow-2xl">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-400 mx-auto mb-8">
            <UserPlus size={40} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Claim Your Identity</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Every participant in the REC marketplace needs a human-readable ENS identity. 
            Please use the <b>"Claim .eth"</b> button in the top menu to get started.
          </p>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-500 italic">
            Waiting for ENS identity link...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
        <h1 className="text-3xl font-bold mb-2">Welcome, {ensName}</h1>
        <p className="text-slate-400 mb-10">Select your primary role to access the marketplace dashboards.</p>
        
        <div className="grid sm:grid-cols-2 gap-6">
          <button 
            onClick={() => setRole(1)}
            className={`p-8 rounded-3xl border-2 text-left transition-all group ${
              role === 1 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
              role === 1 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900 text-emerald-400'
            }`}>
              <Building2 size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Producer</h3>
            <p className="text-sm text-slate-500">I sell verified RECs.</p>
          </button>

          <button 
            onClick={() => setRole(2)}
            className={`p-8 rounded-3xl border-2 text-left transition-all group ${
              role === 2 ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
              role === 2 ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900 text-emerald-400'
            }`}>
              <User size={28} />
            </div>
            <h3 className="text-xl font-bold mb-2">Consumer</h3>
            <p className="text-sm text-slate-500">I buy & retire RECs.</p>
          </button>
        </div>

        <button 
          disabled={!role || loading}
          onClick={handleFinalizeRole}
          className="mt-12 w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Check size={20} /> Finalize Setup</>}
        </button>
      </div>
    </div>
  );
};

export default Register;
