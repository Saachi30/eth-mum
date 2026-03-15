import React, { useState, useEffect } from 'react';
import { ShoppingCart, Tag, MapPin, Clock } from 'lucide-react';
import { ethers } from 'ethers';

const RECTrade = ({ contract, account }) => {
  const [tradeType, setTradeType] = useState('buy');
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [selectedRec, setSelectedRec] = useState(null);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [listings, setListings] = useState([]);
  const [energyType, setEnergyType] = useState('solar');
  const [ownedBalances, setOwnedBalances] = useState([]);

  const energyTypes = [
    'solar',
    'wind',
    'hydro',
    'biomass',
    'geothermal'
  ];

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const activeListings = await contract.getActiveListings();
        const formattedListings = activeListings.map(listing => ({
          id: listing.id.toString(),
          seller: listing.seller,
          amount: ethers.utils.formatEther(listing.amount),
          price: ethers.utils.formatEther(listing.price),
          energyType: listing.energyType,
          active: listing.active
        }));
        setListings(formattedListings);
      } catch (error) {
        console.error('Error fetching listings:', error);
      }
    };

    const fetchOwnedBalances = async () => {
      try {
        const [balances, types] = await contract.getBalanceInTokensByEnergyType(account);
        const formattedBalances = balances.map((balance, index) => ({
          energyType: types[index],
          amount: ethers.utils.formatEther(balance)
        }));
        setOwnedBalances(formattedBalances);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };

    if (contract && account) {
      fetchListings();
      fetchOwnedBalances();
    }
  }, [contract, account]);

  const handleBuyTokens = async () => {
    try {
      setLoading(true);
      setError('');
      const amountInWei = ethers.utils.parseEther(amount);
      const tx = await contract.buyTokensByEnergyType(energyType, amountInWei);
      await tx.wait();
      setSuccess('Purchase successful');
      setShowBuyDialog(false);
    } catch (error) {
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListTokens = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const amountInWei = ethers.utils.parseEther(amount);
      const priceInWei = ethers.utils.parseEther(price);
      const tx = await contract.listTokens(amountInWei, priceInWei, energyType);
      await tx.wait();
      setSuccess('Tokens listed successfully!');
      setShowListDialog(false);
    } catch (err) {
      setError(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const Dialog = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    const handleDialogClick = (e) => {
      e.stopPropagation();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div 
          className="bg-white rounded-lg p-6 max-w-md w-full m-4 dialog-content" 
          onClick={handleDialogClick}
        >
          {children}
        </div>
      </div>
    );
  };

  const BuyDialog = () => (
    <Dialog isOpen={showBuyDialog} onClose={() => setShowBuyDialog(false)}>
      <h2 className="text-2xl font-bold mb-4">Buy Tokens</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Energy Type</label>
          <select
            value={energyType}
            onChange={(e) => setEnergyType(e.target.value)}
            className="w-full p-2 border rounded bg-white"
          >
            {energyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
          />
        </div>
        <button
          onClick={handleBuyTokens}
          disabled={loading}
          className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Confirm Purchase'}
        </button>
      </div>
    </Dialog>
  );

  const ListDialog = () => (
    <Dialog isOpen={showListDialog} onClose={() => setShowListDialog(false)}>
      <h2 className="text-2xl font-bold mb-4">List Tokens</h2>
      <form onSubmit={handleListTokens} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter amount"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter price"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Energy Type</label>
          <select
            value={energyType}
            onChange={(e) => setEnergyType(e.target.value)}
            className="w-full p-2 border rounded bg-white"
          >
            {energyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'List Tokens'}
        </button>
      </form>
    </Dialog>
  );

  return (
    <div className="bg-white w-full rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">Trade RECs</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setTradeType('buy')}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              tradeType === 'buy'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Buy RECs
          </button>
          <button
            onClick={() => setTradeType('sell')}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              tradeType === 'sell'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Sell RECs
          </button>
        </div>
      </div>

      {tradeType === 'buy' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">Listing #{listing.id}</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag className="w-4 h-4 mr-1" />
                      <span>{listing.energyType} REC</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRec(listing);
                      setEnergyType(listing.energyType);
                      setAmount(listing.amount);
                      setShowBuyDialog(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Buy Now
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1 flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Available
                    </div>
                    <div>{parseFloat(listing.amount).toLocaleString()} RECs</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1 flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      Price
                    </div>
                    <div>{parseFloat(listing.price).toFixed(6)} ETH/REC</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Seller
                    </div>
                    <div className="truncate">{listing.seller}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {ownedBalances.map((balance, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg mb-1">{balance.energyType} RECs</h4>
                    <div className="flex items-center text-sm text-gray-600">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      <span>{parseFloat(balance.amount).toLocaleString()} RECs Available</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEnergyType(balance.energyType);
                      setShowListDialog(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    List for Sale
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(error || success) && (
        <div className={`mt-4 p-3 rounded ${
          error ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'
        }`}>
          {error || success}
        </div>
      )}

      <BuyDialog />
      <ListDialog />
    </div>
  );
};

export default RECTrade;