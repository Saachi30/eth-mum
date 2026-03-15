import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ActiveListings from './ActiveListings';
const BuyTokensByType = ({ contractAddress }) => {
  const [energyType, setEnergyType] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);

  const abi = [
    {"inputs":[],"name":"getActiveListings","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"seller","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"string","name":"energyType","type":"string"},{"internalType":"bool","name":"active","type":"bool"}],"internalType":"struct RECDominator.Listing[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"string","name":"energyType","type":"string"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"buyTokensByEnergyType","outputs":[],"stateMutability":"nonpayable","type":"function"}
  ];

  useEffect(() => {
    fetchActiveListings();
  }, []);

  const fetchActiveListings = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, abi, provider);
      const allListings = await contract.getActiveListings();
      setListings(allListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const buyTokens = async () => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      const tx = await contract.buyTokensByEnergyType(energyType, amount);
      await tx.wait();
      alert('Purchase successful');
      fetchActiveListings();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getListingsByEnergyType = (type) => {
    return listings.filter(listing => 
      listing.active && listing.energyType.toLowerCase() === type.toLowerCase()
    );
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <input 
          type="text"
          value={energyType}
          onChange={(e) => setEnergyType(e.target.value)}
          placeholder="Energy Type"
          className="border p-2 mr-2"
        />
        <input 
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="border p-2 mr-2"
        />
        <button 
          onClick={buyTokens}
          disabled={loading || !energyType || !amount}
          className="bg-blue-500 text-white p-2 rounded"
        >
          {loading ? 'Processing...' : 'Buy Tokens'}
        </button>
      </div>

     
    </div>
  );
};

export default BuyTokensByType;