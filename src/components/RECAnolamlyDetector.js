import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Clock, Wallet } from 'lucide-react';
import abi from '../abi.json'
const RECAnomalyDetector = () => {
  const [transactions, setTransactions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [error, setError] = useState('');

  // Contract configuration
  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0xCD0cF33577e210c6Bbd48eBafa9473123e88b15b"; // Replace with your contract address
  const CONTRACT_ABI = abi;

  // Initialize Web3 and contract
  const initializeWeb3 = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) {
        throw new Error("MetaMask not found! Please install MetaMask.");
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setUserAddress(accounts[0]);
      setConnectionStatus('Connected to MetaMask');

      // Create Web3 provider and contract instance
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setContract(contractInstance);

      // Setup MetaMask event listeners
      window.ethereum.on('accountsChanged', (accounts) => {
        setUserAddress(accounts[0]);
        fetchData(accounts[0]);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return contractInstance;
    } catch (err) {
      setError(`Initialization error: ${err.message}`);
      setConnectionStatus('Connection failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction data
  const fetchData = async (address) => {
    if (!contract || !address) return;
  
    try {
      setLoading(true);
      setError('');
  
      console.log('Fetching data for address:', address);
  
      // Get all active listings
      const activeListings = await contract.getActiveListings();
      
      // Filter transactions related to the searched address
      const relevantTransactions = activeListings
        .filter(listing => 
          listing.seller.toLowerCase() === address.toLowerCase() && listing.active
        )
        .map(listing => ({
          counterparty: listing.seller,
          amount: parseFloat(listing.amount.toString()),
          price: parseFloat(listing.pricePerToken.toString()),
          energyType: listing.energyType,
          timestamp: Date.now() / 1000, // Current timestamp since listing timestamp isn't available
          type: 'sell',
          listingId: listing.id.toString()
        }));
  
      setTransactions(relevantTransactions);
      
      if (relevantTransactions.length > 0) {
        const anomalies = detectAnomalies(relevantTransactions);
        setAnomalies(anomalies);
        const stats = calculateStats(relevantTransactions);
        setStats(stats);
      }
      
      // You might also want to get the balance for this address
      const balance = await contract.balanceOf(address);
      console.log('Address balance:', balance.toString());
  
    } catch (err) {
      setError(`Data fetch error: ${err.message}`);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    initializeWeb3();
  }, []);

  // Anomaly detection logic (unchanged)
// Stats calculation logic
const calculateStats = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return {
      totalVolume: 0,
      avgPrice: 0,
      transactionCount: 0
    };
  }

  return {
    totalVolume: transactions.reduce((sum, tx) => sum + tx.amount, 0),
    avgPrice: transactions.reduce((sum, tx) => sum + tx.price, 0) / transactions.length,
    transactionCount: transactions.length
  };
};

// Anomaly detection logic
const detectAnomalies = (transactions) => {
  if (!transactions || transactions.length < 2) return [];

  const anomalies = [];
  const avgPrice = transactions.reduce((sum, tx) => sum + tx.price, 0) / transactions.length;
  const avgVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length;
  
  // Price threshold for anomaly detection (e.g., 50% deviation from average)
  const priceThreshold = avgPrice * 0.5;
  const volumeThreshold = avgVolume * 0.5;

  transactions.forEach(tx => {
    // Check for price anomalies
    if (Math.abs(tx.price - avgPrice) > priceThreshold) {
      anomalies.push({
        timestamp: tx.timestamp,
        message: `Unusual price: ${tx.price.toFixed(2)} ETH (Average: ${avgPrice.toFixed(2)} ETH)`,
        severity: 'high'
      });
    }

    // Check for volume anomalies
    if (Math.abs(tx.amount - avgVolume) > volumeThreshold) {
      anomalies.push({
        timestamp: tx.timestamp,
        message: `Unusual volume: ${tx.amount.toFixed(2)} RECs (Average: ${avgVolume.toFixed(2)} RECs)`,
        severity: 'medium'
      });
    }
  });

  return anomalies;
};

  // Handle address search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (ethers.utils.isAddress(searchAddress)) {
      await fetchData(searchAddress);
    } else {
      setError('Invalid Ethereum address');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Connection Status */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Wallet className={`w-5 h-5 ${connectionStatus === 'Connected to MetaMask' ? 'text-green-500' : 'text-red-500'}`} />
          <span className="font-semibold">{connectionStatus}</span>
        </div>
        {userAddress && (
          <div className="text-sm text-gray-600">
            Connected Address: {userAddress}
          </div>
        )}
        {error && (
          <div className="mt-2 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Ethereum address to analyze"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Loading transaction data...</p>
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-6">
          {/* Stats Overview */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex items-center gap-2">
      <TrendingUp className="w-5 h-5 text-green-500" />
      <h3 className="font-semibold">Total Volume</h3>
    </div>
    <p className="text-2xl mt-2">{(stats?.totalVolume || 0).toFixed(2)} RECs</p>
  </div>
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex items-center gap-2">
      <TrendingDown className="w-5 h-5 text-blue-500" />
      <h3 className="font-semibold">Average Price</h3>
    </div>
    <p className="text-2xl mt-2">{(stats?.avgPrice || 0).toFixed(2)} ETH</p>
  </div>
  <div className="p-4 bg-white rounded-lg shadow">
    <div className="flex items-center gap-2">
      <Clock className="w-5 h-5 text-purple-500" />
      <h3 className="font-semibold">Transaction Count</h3>
    </div>
    <p className="text-2xl mt-2">{stats?.transactionCount || 0}</p>
  </div>
</div>

          {/* Transaction Chart */}
          <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
            <div className="min-w-[800px]">
              <LineChart width={800} height={400} data={transactions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleDateString()}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  name="Volume"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="price" 
                  stroke="#82ca9d" 
                  name="Price"
                />
              </LineChart>
            </div>
          </div>

          {/* Anomalies Section */}
          {anomalies.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Detected Anomalies</h2>
              <div className="space-y-4">
                {anomalies.map((anomaly, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg ${
                      anomaly.severity === 'high' ? 'bg-red-100' :
                      anomaly.severity === 'medium' ? 'bg-yellow-100' : 
                      'bg-blue-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-semibold">{anomaly.message}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(anomaly.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          No transaction data to display. Enter an address to begin analysis.
        </div>
      )}
    </div>
  );
};

export default RECAnomalyDetector;