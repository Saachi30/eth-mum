import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, TrendingUp, DollarSign, Activity, X, MessageSquare } from 'lucide-react';
import { ethers } from 'ethers';



const SpecializedYieldAnalyzer = ({ contractAddress, contractABI, walletAddress, userType }) => {
  const GEMINI_API_KEY = 'AIzaSyDypXKVdmg7_PTGyFbqCHMEwAMMRmUIAK4';
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
   contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS || "0xCD0cF33577e210c6Bbd48eBafa9473123e88b15b";
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState(0);
  const [analysisData, setAnalysisData] = useState({
    metrics: {
      avgPurchasePrice: {},
      avgSellingPrice: {},
      marketPosition: {},
    },
    recommendations: [],
    historicalData: [],
    aiRecommendations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // Colors for the donut chart
  const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

  // Prepare data for donut chart
  const getDonutData = () => {
    if (userType === 'buyer') {
      return Object.entries(analysisData.metrics.avgPurchasePrice || {}).map(([type, data]) => ({
        name: type,
        value: data.totalAmount
      }));
    }
    return Object.entries(analysisData.metrics.avgSellingPrice || {}).map(([type, data]) => ({
      name: type,
      value: data.totalRevenue
    }));
  };

  const ChatModal = () => (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl">
      <div className="h-[610px] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-800">AI Assistant</h3>
          <button 
            onClick={() => setShowChat(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {analysisData.aiRecommendations.map((rec, index) => (
            <div key={index} className="flex space-x-3">
              <div className="flex-shrink-0">
                <Activity className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex-1 bg-indigo-50 rounded-lg p-3">
                <p className="text-gray-700">{rec.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Ask a question..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );


  const isValidAddress = (address) => {
    try {
      if (!address || typeof address !== 'string') return false;
      return ethers.utils.isAddress(address);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const initContract = async () => {
      try {
        if (!isValidAddress(contractAddress)) {
          throw new Error(`Invalid contract address: ${contractAddress}`);
        }
        
        if (!isValidAddress(walletAddress)) {
          throw new Error(`Invalid wallet address: ${walletAddress}`);
        }

        if (!contractABI || !Array.isArray(contractABI)) {
          throw new Error('Contract ABI must be a valid array');
        }

        if (typeof window.ethereum === 'undefined') {
          throw new Error('Ethereum provider not found');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(
          ethers.utils.getAddress(contractAddress),
          contractABI,
          signer
        );
        setContract(contractInstance);
      } catch (err) {
        console.error('Contract initialization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initContract();
  }, [contractAddress, contractABI, walletAddress]);

  const analyzeBuyerMetrics = async (buyingHistory, activeListings) => {
    const metrics = {
      portfolioValue: 0,
      avgPurchasePrice: {},
      opportunities: [],
      savingsOpportunities: [],
    };

    if (Array.isArray(buyingHistory)) {
      buyingHistory.forEach((tx) => {
        const { energyType, amount, price } = tx;
        if (!metrics.avgPurchasePrice[energyType]) {
          metrics.avgPurchasePrice[energyType] = {
            totalCost: 0,
            totalAmount: 0,
          };
        }
        metrics.avgPurchasePrice[energyType].totalCost += Number(amount) * Number(price);
        metrics.avgPurchasePrice[energyType].totalAmount += Number(amount);
      });
    }

    if (Array.isArray(activeListings)) {
      activeListings.forEach((listing) => {
        const avgPrice =
          metrics.avgPurchasePrice[listing.energyType]?.totalCost /
          metrics.avgPurchasePrice[listing.energyType]?.totalAmount;

        if (avgPrice && listing.price < avgPrice) {
          metrics.opportunities.push({
            energyType: listing.energyType,
            price: listing.price,
            potentialSavings: ((avgPrice - listing.price) / avgPrice) * 100,
          });
        }
      });
    }

    return metrics;
  };

  const analyzeProducerMetrics = async (sellingHistory, activeListings) => {
    const metrics = {
      totalRevenue: 0,
      avgSellingPrice: {},
      marketPosition: {},
      optimalPrices: {},
    };

    if (Array.isArray(sellingHistory)) {
      sellingHistory.forEach((tx) => {
        const { energyType, amount, price } = tx;
        metrics.totalRevenue += Number(amount) * Number(price);

        if (!metrics.avgSellingPrice[energyType]) {
          metrics.avgSellingPrice[energyType] = {
            totalRevenue: 0,
            totalAmount: 0,
          };
        }
        metrics.avgSellingPrice[energyType].totalRevenue += Number(amount) * Number(price);
        metrics.avgSellingPrice[energyType].totalAmount += Number(amount);
      });
    }

    if (Array.isArray(activeListings)) {
      activeListings.forEach((listing) => {
        if (!metrics.marketPosition[listing.energyType]) {
          metrics.marketPosition[listing.energyType] = {
            totalListings: 0,
            avgMarketPrice: 0,
          };
        }
        metrics.marketPosition[listing.energyType].totalListings++;
        metrics.marketPosition[listing.energyType].avgMarketPrice += Number(listing.price);
      });
    }

    return metrics;
  };


  const generateRecommendations = (metrics, userType) => {
    const recommendations = [];
    if (userType === 'buyer' && metrics.opportunities) {
      metrics.opportunities.forEach((opp) => {
        recommendations.push({
          type: 'opportunity',
          message: `Potential saving of ${opp.potentialSavings.toFixed(2)}% on ${opp.energyType}`,
          icon: DollarSign
        });
      });
    } else if (metrics.marketPosition && metrics.avgSellingPrice) {
      Object.entries(metrics.marketPosition).forEach(([energyType, data]) => {
        const avgMarketPrice = data.avgMarketPrice / data.totalListings;
        const avgSellingPrice = metrics.avgSellingPrice[energyType]?.totalRevenue / 
                              metrics.avgSellingPrice[energyType]?.totalAmount;
        if (avgMarketPrice > avgSellingPrice) {
          recommendations.push({
            type: 'pricing',
            message: `Consider increasing ${energyType} price to match market average`,
            icon: TrendingUp
          });
        }
      });
    }
    return recommendations;
  };
  const fetchBalance = async () => {
    try {
      if (contract) {
        const bal = await contract.balanceOf(walletAddress);
        setBalance(ethers.utils.formatUnits(bal, 18));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [contract, walletAddress]);

  const generateAIRecommendations = async (metrics, userType, historicalData) => {
    try {
      const prompt = `
        Analyze this trading data and provide 2 key recommendations in 1-2 sentences each:
        User: ${userType}
        History: ${JSON.stringify(historicalData)}
        Metrics: ${JSON.stringify(metrics)}
      `;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        })
      });

      if (!response.ok) throw new Error('Failed to get recommendations');
      const data = await response.json();
      return data.candidates[0].content.parts[0].text.split('\n')
        .filter(rec => rec.trim())
        .slice(0, 2)
        .map(rec => ({
          type: 'ai',
          message: rec.replace(/^\d+\.\s*/, '').trim(),
          icon: Activity
        }));
    } catch (error) {
      console.error('Error:', error);
      return [{ type: 'ai', message: 'Unable to generate recommendations. Please try again.', icon: AlertCircle }];
    }
  };

  useEffect(() => {
    const performAnalysis = async () => {
      if (!contract || !isValidAddress(walletAddress)) return;

      try {
        setLoading(true);
        setError(null);

        const buyingHistory = await contract.getBuyingHistory(walletAddress);
        const sellingHistory = await contract.getSellingHistory(walletAddress);
        const activeListings = await contract.getActiveListings();

        let metrics;
        if (userType === 'buyer') {
          metrics = await analyzeBuyerMetrics(buyingHistory, activeListings);
        } else {
          metrics = await analyzeProducerMetrics(sellingHistory, activeListings);
        }

        const recommendations = generateRecommendations(metrics, userType);
        const aiRecommendations = await generateAIRecommendations(
          metrics,
          userType,
          userType === 'buyer' ? buyingHistory : sellingHistory
        );

        setAnalysisData({
          metrics,
          recommendations,
          historicalData: userType === 'buyer' ? buyingHistory : sellingHistory,
          aiRecommendations,
        });
      } catch (error) {
        console.error('Analysis failed:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    performAnalysis();
  }, [contract, walletAddress, userType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full items-center mx-auto  bg-white shadow-lg rounded-lg p-6 px-7">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {userType === 'buyer' ? 'Buyer Analytics Dashboard' : 'Producer Analytics Dashboard'}
        </h2>
      </div>
      
      <div className="space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userType === 'buyer'
            ? Object.entries(analysisData.metrics.avgPurchasePrice || {}).map(([type, data]) => (
                <div key={type} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900">{type}</h4>
                  <div className="mt-2 space-y-1 text-gray-600">
                    <p>Avg Purchase Price: {(data.totalCost / data.totalAmount).toFixed(2)}</p>
                    <p>Total Volume: {data.totalAmount.toFixed(2)}</p>
                    <p>REC Token Balance : {balance}</p>
                  </div>
                </div>
              ))
            : Object.entries(analysisData.metrics.avgSellingPrice || {}).map(([type, data]) => (
                <div key={type} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900">{type}</h4>
                  <div className="mt-2 space-y-1 text-gray-600">
                    <p>Avg Selling Price: {(data.totalRevenue / data.totalAmount).toFixed(2)}</p>
                    <p>Total Revenue: {data.totalRevenue.toFixed(2)}</p>
                    <p>
                      Market Position:{' '}
                      {analysisData.metrics.marketPosition[type]?.totalListings || 0} active listings
                    </p>
                  </div>
                </div>
              ))}
        </div>

        {/* Price Trends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Trends */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {userType === 'buyer' ? 'Purchase Price Trends' : 'Sales Price Trends'}
            </h3>
            <div className="h-64">
              <LineChart
                width={500}
                height={200}
                data={analysisData.historicalData.map((tx) => ({
                  date: new Date(Number(tx.timestamp) * 1000).toLocaleDateString(),
                  price: Number(tx.price),
                  energyType: tx.energyType,
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#6366f1" />
              </LineChart>
            </div>
          </div>

          {/* Distribution Donut Chart */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {userType === 'buyer' ? 'Purchase Distribution' : 'Revenue Distribution'}
            </h3>
            <div className="h-64">
              <PieChart width={550} height={200}>
                <Pie
                  data={getDonutData()}
                  cx={250}
                  cy={100}
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  className='mb-4'
                >
                  {getDonutData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={8} className='mr-1' />
              </PieChart>
            </div>
          </div>
        </div>
        {/* Standard Recommendations */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Market Recommendations</h3>
          {analysisData.recommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg shadow-sm"
            >
              <rec.icon className="w-5 h-5 text-blue-500 mt-0.5" />
              <span className="text-gray-700">{rec.message}</span>
            </div>
          ))}
        </div>

        {/* AI-Powered Recommendations */}
        <div className="space-y-4">
    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4">
      <p className="text-sm text-gray-600">
        These insights are generated using AI analysis of your trading history and market conditions
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {analysisData.aiRecommendations.map((rec, index) => (
        <div
          key={index}
          className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <rec.icon className="w-5 h-5 text-indigo-500 mt-0.5" />
          <div className="flex-1">
            <span className="text-gray-700 block">{rec.message}</span>
            {rec.type === 'ai' && (
              <span className="text-xs text-indigo-400 mt-1 block">
                AI-generated recommendation
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>


        {/* Additional Information */}
        <div className="mt-8 flex items-center justify-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            <p>Last updated: {new Date().toLocaleString()}</p>
            <p>Data source: Blockchain analytics + AI-powered insights</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecializedYieldAnalyzer;