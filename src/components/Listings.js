import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ShoppingCart, Tag, MapPin, Zap, ShieldCheck, Loader2, Search, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BuyContractModal from './BuyContractModal';

const Listings = ({ contract, account }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setActiveMode] = useState('browse'); // 'browse' | 'match'
  const [selectedListing, setSelectedListing] = useState(null); // listing shown in modal

  // Matching Engine State
  const [matchCriteria, setMatchCriteria] = useState({
    amount: '',
    maxPrice: '',
    energyType: 'any'
  });
  const [matches, setMatches] = useState([]);

  const fetchListings = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const activeListings = await contract.getActiveListings();
      const formatted = activeListings.map(listing => ({
        id: listing.id.toString(),
        seller: listing.seller,
        amount: listing.amount.toString(),
        price: listing.pricePerToken.toString(),
        energyType: listing.energyType,
        location: listing.location,
        creditRatio: listing.creditRatio
      }));
      setListings(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [contract]);

  // P2P Matching Algorithm
  const runMatchingAlgo = () => {
    if (!matchCriteria.amount || !matchCriteria.maxPrice) {
        toast.warning("Please enter your requirements first");
        return;
    }

    const filtered = listings.filter(l => {
        const typeMatch = matchCriteria.energyType === 'any' || l.energyType.toLowerCase() === matchCriteria.energyType.toLowerCase();
        const priceMatch = Number(l.price) <= Number(matchCriteria.maxPrice);
        const amountMatch = Number(l.amount) >= Number(matchCriteria.amount);
        return typeMatch && priceMatch && amountMatch;
    });

    // Sort by best price first
    const sorted = filtered.sort((a, b) => Number(a.price) - Number(b.price));
    setMatches(sorted);
    
    if (sorted.length > 0) {
        toast.success(`Found ${sorted.length} perfect matches for your request!`);
    } else {
        toast.info("No perfect matches found. Try adjusting your price or amount.");
    }
  };

  // Opens the contract-generation modal for a listing
  const handleBuy = (listingId, amount, price) => {
    const listing = listings.find(l => l.id === listingId);
    if (listing) setSelectedListing(listing);
  };

  const browseListings = listings.filter(l => 
    l.energyType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Contract Generation Modal */}
      {selectedListing && (
        <BuyContractModal
          listing={selectedListing}
          account={account}
          contract={contract}
          onClose={() => setSelectedListing(null)}
          onSuccess={() => { fetchListings(); setMatches([]); setSelectedListing(null); }}
        />
      )}
      {/* Mode Selector */}
      <div className="flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit mx-auto md:mx-0">
        <button 
          onClick={() => setActiveMode('browse')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'browse' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Browse All
        </button>
        <button 
          onClick={() => setActiveMode('match')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'match' ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Sparkles size={14} />
          P2P Match
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'browse' ? (
          <motion.div 
            key="browse"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search solar, wind, Mumbai..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button onClick={fetchListings} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 text-sm font-bold">
                Refresh Listings
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>
            ) : browseListings.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-[2.5rem] border border-slate-800 border-dashed">
                <p className="text-slate-500">No active listings found.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {browseListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} handleBuy={handleBuy} />
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="match"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Matching Inputs */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="grid md:grid-cols-4 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Energy Type</label>
                        <select 
                            value={matchCriteria.energyType}
                            onChange={(e) => setMatchCriteria({...matchCriteria, energyType: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:border-cyan-500/50"
                        >
                            <option value="any">Any Source</option>
                            <option value="solar">Solar Only</option>
                            <option value="wind">Wind Only</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Amount Needed (MWh)</label>
                        <input 
                            type="number"
                            placeholder="e.g. 5"
                            value={matchCriteria.amount}
                            onChange={(e) => setMatchCriteria({...matchCriteria, amount: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:border-cyan-500/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Max Price (Credits)</label>
                        <input 
                            type="number"
                            placeholder="e.g. 100"
                            value={matchCriteria.maxPrice}
                            onChange={(e) => setMatchCriteria({...matchCriteria, maxPrice: e.target.value})}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:border-cyan-500/50"
                        />
                    </div>
                    <button 
                        onClick={runMatchingAlgo}
                        className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                        Find Best Matches
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Match Results */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {matches.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} handleBuy={handleBuy} isMatch={true} />
                ))}
                {matchCriteria.amount && matches.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        No sellers meet your exact criteria. Try increasing your max price or browsing all listings.
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ListingCard = ({ listing, handleBuy, isMatch }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-slate-900 border rounded-3xl p-6 transition-all group ${isMatch ? 'border-cyan-500/50 shadow-xl shadow-cyan-500/5' : 'border-slate-800 hover:border-emerald-500/30'}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isMatch ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          <Zap size={24} />
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-white">{listing.price}</div>
          <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Credits / MWh</div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3">
          <Tag size={16} className="text-slate-500" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">{listing.energyType}</span>
        </div>
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-slate-500" />
          <span className="text-sm text-slate-400">{listing.location || 'Remote'}</span>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-[10px] font-mono text-slate-600 truncate">Reward Ratio: {listing.creditRatio}%</span>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-bold">Supply</div>
          <div className="text-lg font-bold text-white">{listing.amount} <span className="text-xs font-normal text-slate-600">MWh</span></div>
        </div>
        <button
          onClick={() => handleBuy(listing.id, listing.amount, listing.price)}
          className={`px-6 py-2.5 font-black rounded-xl transition-all active:scale-95 flex items-center gap-2 ${isMatch ? 'bg-cyan-500 hover:bg-cyan-600 text-slate-950' : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'}`}
        >
          <ShoppingCart size={16} />
          Buy Now
        </button>
      </div>
    </motion.div>
);

export default Listings;
