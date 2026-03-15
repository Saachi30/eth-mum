// BuyerProfile.js
import React, { useState, useEffect } from 'react';

const BuyerProfile = ({ contract, account }) => {
    const [buyerInfo, setBuyerInfo] = useState({ registered: false, approved: false });

    useEffect(() => {
        if (contract && account) {
            fetchBuyerInfo();
        }
    }, [contract, account]);

    const fetchBuyerInfo = async () => {
        try {
            const info = await contract.getBuyerInfo(account);
            setBuyerInfo(info);
        } catch (error) {
            console.error("Error fetching buyer info:", error);
        }
    };

    const handleRegister = async () => {
        try {
            const tx = await contract.registerBuyer();
            await tx.wait();
            await fetchBuyerInfo();
        } catch (error) {
            console.error("Error registering buyer:", error);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Buyer Profile</h2>
            </div>
            <div className="space-y-4">
                <div>
                    <p>Status: {buyerInfo.registered ? "Registered" : "Not Registered"}</p>
                    <p>Approval: {buyerInfo.approved ? "Approved" : "Pending Approval"}</p>
                </div>
                {!buyerInfo.registered && (
                    <button
                        onClick={handleRegister}
                        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                        Register as Buyer
                    </button>
                )}
            </div>
        </div>
    );
};

// BuyHistory.js


// SellHistory.js


export default BuyerProfile;
