import React, { useState, useEffect } from 'react';
import { List, Trash2, Tag, Zap, Loader2, MapPin } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { syncActionToEns } from '../utils/ensHelper';

const ActiveListings = ({ contract, account }) => {
  const { ensName } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchListings = async () => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const activeListings = await contract.getActiveListings();
      const myActiveListings = activeListings
        .filter(listing => listing.seller.toLowerCase() === account.toLowerCase())
        .map(listing => ({
          id: listing.id.toString(),
          amount: listing.amount.toString(),
          price: listing.pricePerToken.toString(),
          energyType: listing.energyType,
          location: listing.location,
          creditRatio: listing.creditRatio
        }));
      setListings(myActiveListings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [contract, account]);

  const handleCancel = async (id) => {
    if (!contract) return;
    setCancellingId(id);
    try {
      const tx = await contract.cancelListing(id);
      toast.info("Cancelling listing on-chain...");
      await tx.wait();
      toast.success("Listing cancelled and tokens returned to balance.");
      
      // Sync to ENS
      if (ensName) {
        syncActionToEns(ensName, "listing_history", {
            type: "CANCEL",
            listingId: id,
            txHash: tx.hash
        }).catch(err => console.error("ENS sync failed:", err));
      }

      fetchListings();
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel listing");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <List size={20} />
          </div>
          <h2 className="text-xl font-bold text-white">My Active Listings</h2>
        </div>
        <button onClick={fetchListings} className="text-xs text-slate-500 hover:text-emerald-400">Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-500" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800 border-dashed">
          No active listings.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {listings.map((item) => (
            <div key={item.id} className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/20 transition-all group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white uppercase tracking-wider">{item.energyType}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin size={10} />
                      {item.location}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-white">{item.price}</div>
                    <div className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">Credits / MWh</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Credit Reward Ratio</div>
                <div className="text-[10px] font-bold text-emerald-400">{item.creditRatio}%</div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between">
                <div>
                   <div className="text-[10px] text-slate-500 uppercase font-bold">In Escrow</div>
                   <div className="text-md font-bold text-white">{item.amount} MWh</div>
                </div>
                <button 
                  disabled={cancellingId === item.id}
                  onClick={() => handleCancel(item.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Cancel Listing"
                >
                  {cancellingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveListings;
