import React from 'react';
import { Building2, Award, TrendingUp } from 'lucide-react';

const CompanyProfile = () => {
  const profile = {
    name: 'Tech Solutions Inc',
    creditScore: 85,
    totalRECs: 2500,
    carbonOffset: 450,
    yearlyGoal: 75
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Building2 size={32} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold">{profile.name}</h3>
          <div className="flex items-center text-green-600">
            <Award size={16} />
            <span className="ml-1">Top 10% Performer</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Credit Score</span>
            <span className="text-2xl font-bold">{profile.creditScore}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 rounded-full h-2" 
              style={{ width: `${profile.creditScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-gray-600 mb-1">Total RECs</h4>
            <p className="text-2xl font-bold">{profile.totalRECs}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-gray-600 mb-1">Carbon Offset</h4>
            <p className="text-2xl font-bold">{profile.carbonOffset} tons</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span>Yearly Goal Progress</span>
            <span className="font-bold">{profile.yearlyGoal}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 rounded-full h-2" 
              style={{ width: `${profile.yearlyGoal}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
export default CompanyProfile;