import React from 'react'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line} from 'recharts';

const priceData = [
    { name: "Jan", solar: 45, wind: 50 },
    { name: "Feb", solar: 50, wind: 48 },
    { name: "Mar", solar: 55, wind: 53 },
    { name: "Apr", solar: 52, wind: 55 },
    { name: "May", solar: 58, wind: 60 },
    { name: "Jun", solar: 60, wind: 62 },
    { name: "Jul", solar: 62, wind: 65 },
    { name: "Aug", solar: 65, wind: 67 },
    { name: "Sep", solar: 68, wind: 70 },
    { name: "Oct", solar: 70, wind: 72 },
    { name: "Nov", solar: 72, wind: 75 },
    { name: "Dec", solar: 75, wind: 78 },
  ];
const PriceChart = () => (
    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-xl font-bold mb-4">REC Price Trends</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="solar" stroke="#F59E0B" />
            <Line type="monotone" dataKey="wind" stroke="#3B82F6" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
  

export default PriceChart
