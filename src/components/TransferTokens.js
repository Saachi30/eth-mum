import React, { useState, useEffect } from 'react';

const TransferTokens = ({ contract }) => {
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    energyType: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const checkBuyerStatus = async (address) => {
    try {
      const buyerInfo = await contract.getBuyerInfo(address);
      return buyerInfo.approved;
    } catch (error) {
      return false;
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const isApproved = await checkBuyerStatus(formData.recipient);
      if (!isApproved) {
        setError('Recipient is not an approved buyer');
        return;
      }

      const tx = await contract.transferTokens(
        formData.recipient,
        formData.amount,
        formData.energyType,
        { gasLimit: 200000 }
      );
      await tx.wait();
      setFormData({ recipient: '', amount: '', energyType: '' });
    } catch (error) {
      setError(error.reason || 'Transfer failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md w-full">
      <h3 className="text-lg font-semibold mb-4">Transfer REC Tokens</h3>
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Recipient Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            value={formData.recipient}
            onChange={(e) => setFormData({...formData, recipient: e.target.value})}
            placeholder="0x..."
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="Enter amount"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Energy Type</label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            value={formData.energyType}
            onChange={(e) => setFormData({...formData, energyType: e.target.value})}
            placeholder="solar, wind, hydro"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Transfer Tokens'}
        </button>
      </form>
    </div>
  );
};

export default TransferTokens;