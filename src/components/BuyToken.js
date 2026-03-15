import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const BuyTokens = ({ contract, walletAddress }) => {
  const [listings, setListings] = useState([]);
  const [buyerInfo, setBuyerInfo] = useState({ registered: false, approved: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch buyer info
  useEffect(() => {
    const fetchBuyerInfo = async () => {
      try {
        if (contract && walletAddress) {
          const info = await contract.getBuyerInfo(walletAddress);
          setBuyerInfo(info);
        }
      } catch (err) {
        console.error('Error fetching buyer info:', err);
      }
    };
    fetchBuyerInfo();
  }, [contract, walletAddress]);

  // Buy tokens function
  const handleBuyTokens = async (listingId, amount) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!buyerInfo.approved) {
        throw new Error('You must be an approved buyer to purchase tokens');
      }

      const transaction = await contract.buyTokens(listingId, amount);
      await transaction.wait();
      
      setSuccess(`Successfully purchased ${amount} tokens from listing #${listingId}`);
    } catch (err) {
      setError(err.message || 'Error purchasing tokens');
    } finally {
      setLoading(false);
    }
  };

  // Render helper for status messages
  const renderStatus = () => {
    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      );
    }
    if (success) {
      return (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Buy REC Tokens</h2>
        
        {/* Buyer Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Buyer Status</h3>
          <p>Registration: {buyerInfo.registered ? '✅ Registered' : '❌ Not Registered'}</p>
          <p>Approval: {buyerInfo.approved ? '✅ Approved' : '❌ Not Approved'}</p>
        </div>

        {/* Status Messages */}
        {renderStatus()}

        {/* Example Listing */}
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">Listing #1</h3>
              <p className="text-gray-600">Energy Type: Solar</p>
              <p className="text-gray-600">Available Amount: 100 REC</p>
              <p className="text-gray-600">Price: 0.1 ETH per REC</p>
            </div>
            <button
              onClick={() => handleBuyTokens(1, 10)}
              disabled={loading || !buyerInfo.approved}
              className={`px-4 py-2 rounded-lg ${
                loading || !buyerInfo.approved
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Processing...' : 'Buy 10 Tokens'}
            </button>
          </div>
        </div>

        {/* Registration Notice */}
        {!buyerInfo.registered && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-700">
              You need to register as a buyer before you can purchase tokens.
              Please use the registerBuyer() function to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyTokens;