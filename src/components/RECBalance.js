import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Wind, Droplets, Flame } from 'lucide-react';

const RECBalance = ({ contract, account }) => {
  const [balances, setBalances] = useState({
    solar: '0',
    wind: '0',
    hydro: '0',
    biomass: '0'
  });

  const fetchBalances = async () => {
    if (!contract || !account) return;
    try {
      const types = ['solar', 'wind', 'hydro', 'biomass'];
      const newBalances = {};
      for (const type of types) {
        const bal = await contract.getRECBalance(account, type);
        newBalances[type] = bal.toString();
      }
      setBalances(newBalances);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    return () => clearInterval(interval);
  }, [contract, account]);

  const cards = [
    { type: 'Solar', value: balances.solar, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { type: 'Wind', value: balances.wind, icon: Wind, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { type: 'Hydro', value: balances.hydro, icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    { type: 'Biomass', value: balances.biomass, icon: Flame, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
          <ShieldCheck size={20} />
        </div>
        <h2 className="text-xl font-bold">REC Balances</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-slate-800/50 ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} className={card.color} />
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{card.type}</span>
            </div>
            <div className="text-2xl font-black text-white">{card.value} <span className="text-xs font-normal text-slate-600">MWh</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RECBalance;
