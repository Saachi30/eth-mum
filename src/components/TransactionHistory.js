// import React from 'react';
// import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// const TransactionHistory = () => {
//   const transactions = [
//     {
//       id: 'TX123',
//       type: 'sell',
//       recType: 'Solar',
//       amount: 100,
//       price: 45.50,
//       date: '2024-03-15',
//       buyer: 'Tech Corp'
//     },
//     {
//       id: 'TX124',
//       type: 'buy',
//       recType: 'Wind',
//       amount: 50,
//       price: 38.75,
//       date: '2024-03-14',
//       seller: 'Green Energy Ltd'
//     }
//     // Add more transactions...
//   ];

//   return (
//     <div className="bg-white rounded-xl shadow-sm p-6">
//       <h3 className="text-xl font-bold mb-6">Transaction History</h3>
//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="text-left border-b">
//               <th className="pb-3">Type</th>
//               <th className="pb-3">REC</th>
//               <th className="pb-3">Amount</th>
//               <th className="pb-3">Price</th>
//               <th className="pb-3">Date</th>
//               <th className="pb-3">Party</th>
//             </tr>
//           </thead>
//           <tbody>
//             {transactions.map((tx) => (
//               <tr key={tx.id} className="border-b">
//                 <td className="py-4">
//                   <div className={`flex items-center ${
//                     tx.type === 'sell' ? 'text-green-600' : 'text-blue-600'
//                   }`}>
//                     {tx.type === 'sell' ? 
//                       <ArrowUpRight size={20} /> : 
//                       <ArrowDownRight size={20} />
//                     }
//                     <span className="ml-2 capitalize">{tx.type}</span>
//                   </div>
//                 </td>
//                 <td className="py-4">{tx.recType}</td>
//                 <td className="py-4">{tx.amount}</td>
//                 <td className="py-4">${tx.price}</td>
//                 <td className="py-4">{new Date(tx.date).toLocaleDateString()}</td>
//                 <td className="py-4">{tx.buyer || tx.seller}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default TransactionHistory;

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TransactionHistory = ({ contract, account }) => {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (contract && account) {
            fetchTransactionHistory();
        }
    }, [contract, account]);

    const fetchTransactionHistory = async () => {
        setIsLoading(true);
        try {
            const buyHistory = await contract.getBuyingHistory(account);
            const sellHistory = await contract.getSellingHistory(account);

            // Transform buy history
            const formattedBuyHistory = buyHistory.map(tx => ({
                type: 'buy',
                counterparty: tx.counterparty,
                amount: tx.amount.toString(),
                price: tx.price.toString(),
                energyType: tx.energyType,
                timestamp: tx.timestamp * 1000,
                id: `${tx.timestamp}-${tx.counterparty}-buy`
            }));

            // Transform sell history
            const formattedSellHistory = sellHistory.map(tx => ({
                type: 'sell',
                counterparty: tx.counterparty,
                amount: tx.amount.toString(),
                price: tx.price.toString(),
                energyType: tx.energyType,
                timestamp: tx.timestamp * 1000,
                id: `${tx.timestamp}-${tx.counterparty}-sell`
            }));

            // Combine and sort by timestamp (most recent first)
            const combined = [...formattedBuyHistory, ...formattedSellHistory]
                .sort((a, b) => b.timestamp - a.timestamp);

            setTransactions(combined);
        } catch (error) {
            console.error("Error fetching transaction history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-bold mb-6">Transaction History</h3>
            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No transactions found
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="pb-3">Type</th>
                                <th className="pb-3">REC Type</th>
                                <th className="pb-3">Amount</th>
                                <th className="pb-3">Price (ETH)</th>
                                <th className="pb-3">Date</th>
                                <th className="pb-3">{`Counterparty`}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="border-b hover:bg-gray-50">
                                    <td className="py-4">
                                        <div className={`flex items-center ${
                                            tx.type === 'sell' ? 'text-green-600' : 'text-blue-600'
                                        }`}>
                                            {tx.type === 'sell' ? 
                                                <ArrowUpRight className="h-5 w-5" /> :
                                                <ArrowDownRight className="h-5 w-5" />
                                            }
                                            <span className="ml-2 capitalize">{tx.type}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">{tx.energyType}</td>
                                    <td className="py-4">{tx.amount}</td>
                                    <td className="py-4">{tx.price}</td>
                                    <td className="py-4">
                                        {new Date(tx.timestamp).toLocaleDateString()} 
                                        {' '}
                                        {new Date(tx.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="py-4">
                                        <span className="font-mono">
                                            {`${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}`}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;