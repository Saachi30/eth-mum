const { ethers, baseProvider, getMarketplaceContract } = require('../config/ethers');
const ensService = require('./ensService');

const syncENSHistory = async (userAddress, key, actionData) => {
    try {
        const contract = getMarketplaceContract(baseProvider);
        const identity = await contract.ensIdentities(userAddress);

        if (identity && identity.linked && identity.subnode !== ethers.constants.HashZero) {
            const currentHistory = await ensService.getTextRecord(identity.subnode, key);
            let historyArray = [];
            try {
                if (currentHistory) {
                    historyArray = JSON.parse(currentHistory);
                    if (!Array.isArray(historyArray)) historyArray = [];
                }
            } catch (e) {
                historyArray = [];
            }

            historyArray.push({
                ...actionData,
                timestamp: new Date().toISOString()
            });

            // Limit history to last 10 items
            if (historyArray.length > 10) historyArray = historyArray.slice(-10);

            // Use system-level update (no user private key needed)
            await ensService.systemUpdateTextRecord(identity.subnode, key, JSON.stringify(historyArray));
        }
    } catch (error) {
        console.error("Failed to sync ENS history:", error);
    }
};

const registerProducer = async (userPrivateKey, gst, location, energyTypes) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const tx = await contract.registerProducer(gst, location || "", energyTypes || "");
    await tx.wait();
    return tx.hash;
};

const registerBuyer = async (userPrivateKey) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const tx = await contract.registerBuyer();
    await tx.wait();
    return tx.hash;
};

const linkENSIdentity = async (userPrivateKey, fullName, role, subnode) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const tx = await contract.registerENSIdentity(fullName, role, subnode, { gasLimit: 500000 });
    await tx.wait();
    return tx.hash;
};

const mintTokens = async (userPrivateKey, amount, energyType, zkProofHash) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const proof = zkProofHash || ethers.utils.formatBytes32String("");
    const tx = await contract.mintTokens(amountWei, energyType, proof);
    await tx.wait();
    return tx.hash;
};

const listTokens = async (userPrivateKey, amount, pricePerToken, energyType, zkProofHash) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const priceWei = ethers.utils.parseUnits(pricePerToken.toString(), 18);
    const proof = zkProofHash || ethers.utils.formatBytes32String("");
    const tx = await contract.listTokens(amountWei, priceWei, energyType, proof);
    await tx.wait();

    // Sync to ENS using user address
    await syncENSHistory(userWallet.address, "listing_history", {
        type: "LIST",
        amount: amount.toString(),
        price: pricePerToken.toString(),
        energyType,
        txHash: tx.hash
    });

    return tx.hash;
};

const buyTokens = async (userPrivateKey, listingId, amount, fileverseDocHash) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const docHash = fileverseDocHash || ethers.utils.formatBytes32String("");
    const tx = await contract.buyTokens(listingId, amountWei, docHash);
    await tx.wait();

    // Sync to ENS using user address
    await syncENSHistory(userWallet.address, "buy_history", {
        type: "BUY",
        listingId: listingId.toString(),
        amount: amount.toString(),
        txHash: tx.hash
    });

    return tx.hash;
};

const retireTokens = async (userPrivateKey, amount, energyType) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await contract.retireTokens(amountWei, energyType);
    await tx.wait();
    return tx.hash;
};

const cancelListing = async (userPrivateKey, listingId) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const tx = await contract.cancelListing(listingId);
    await tx.wait();
    return tx.hash;
};

const transferTokens = async (userPrivateKey, to, amount) => {
    const userWallet = new ethers.Wallet(userPrivateKey, baseProvider);
    const contract = getMarketplaceContract(userWallet);
    const amountWei = ethers.utils.parseUnits(amount.toString(), 18);
    const tx = await contract.transfer(to, amountWei);
    await tx.wait();
    return tx.hash;
};

const getProducerInfo = async (address) => {
    const contract = getMarketplaceContract(baseProvider);
    const info = await contract.getProducerInfo(address);
    return {
        gst: info.gst,
        location: info.location,
        energyTypes: info.energyTypes,
        verified: info.verified,
        totalMinted: ethers.utils.formatUnits(info.totalMinted, 18)
    };
};

const getRECBalance = async (address, energyType) => {
    const contract = getMarketplaceContract(baseProvider);
    const balance = await contract.getRECBalance(address, energyType);
    return ethers.utils.formatUnits(balance, 18);
};

const getListing = async (id) => {
    const contract = getMarketplaceContract(baseProvider);
    const l = await contract.getListing(id);
    return {
        id: l.id.toString(),
        seller: l.seller,
        amount: ethers.utils.formatUnits(l.amount, 18),
        pricePerToken: ethers.utils.formatUnits(l.pricePerToken, 18),
        energyType: l.energyType,
        location: l.location,
        active: l.active
    };
};

const syncEnsHistoryManual = async (userAddress, key, actionData) => {
    return await syncENSHistory(userAddress, key, actionData);
};

module.exports = {
    registerProducer,
    registerBuyer,
    linkENSIdentity,
    mintTokens,
    listTokens,
    buyTokens,
    retireTokens,
    cancelListing,
    transferTokens,
    getProducerInfo,
    getRECBalance,
    getListing,
    syncEnsHistoryManual
};
