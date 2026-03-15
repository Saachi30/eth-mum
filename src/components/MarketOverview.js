import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketOverview = () => {
  const [timeframe, setTimeframe] = useState('1M');
  
  const marketData = [
    { date: '2024-03-01', solar: 45.50, wind: 38.75, biomass: 32.25 },
    { date: '2024-03-08', solar: 46.25, wind: 39.50, biomass: 33.00 },
    // Add more data points...
  ];

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Market Overview</h3>
        <div className="flex gap-2">
          {['1W', '1M', '3M', '1Y'].map((time) => (
            <button
              key={time}
              onClick={() => setTimeframe(time)}
              className={`px-3 py-1 rounded-lg ${
                timeframe === time
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={marketData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="solar" stroke="#F59E0B" name="Solar" />
            <Line type="monotone" dataKey="wind" stroke="#3B82F6" name="Wind" />
            <Line type="monotone" dataKey="biomass" stroke="#10B981" name="Biomass" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default MarketOverview;