const ensService = require('../services/ensService');
const marketplaceService = require('../services/marketplaceService');
const aiService = require('../services/aiService');
const fileverseService = require('../services/fileverseService');
const reclaimService = require('../services/reclaimService');

// --- ENS ---
exports.registerEns = async (req, res) => {
    try {
        const { label, userAddress } = req.body;
        if (!label || !userAddress) return res.status(400).json({ error: "Missing label or userAddress" });
        const result = await ensService.registerSubdomain(label, userAddress);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Marketplace Registration ---
exports.registerProducer = async (req, res) => {
    try {
        const { userPrivateKey, gst, location, energyTypes } = req.body;
        if (!userPrivateKey || !gst) return res.status(400).json({ error: "Missing userPrivateKey or gst" });
        const txHash = await marketplaceService.registerProducer(userPrivateKey, gst, location, energyTypes);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.registerBuyer = async (req, res) => {
    try {
        const { userPrivateKey } = req.body;
        if (!userPrivateKey) return res.status(400).json({ error: "Missing userPrivateKey" });
        const txHash = await marketplaceService.registerBuyer(userPrivateKey);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.linkEns = async (req, res) => {
    try {
        const { userPrivateKey, fullName, role, subnode } = req.body;
        const txHash = await marketplaceService.linkENSIdentity(userPrivateKey, fullName, role, subnode);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Token Actions ---
exports.mintTokens = async (req, res) => {
    try {
        const { userPrivateKey, amount, energyType, zkProofHash } = req.body;
        const txHash = await marketplaceService.mintTokens(userPrivateKey, amount, energyType, zkProofHash);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listTokens = async (req, res) => {
    try {
        const { userPrivateKey, amount, pricePerToken, energyType, zkProofHash } = req.body;
        const txHash = await marketplaceService.listTokens(userPrivateKey, amount, pricePerToken, energyType, zkProofHash);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.buyTokens = async (req, res) => {
    try {
        const { userPrivateKey, listingId, amount, fileverseDocHash } = req.body;
        const txHash = await marketplaceService.buyTokens(userPrivateKey, listingId, amount, fileverseDocHash);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.retireTokens = async (req, res) => {
    try {
        const { userPrivateKey, amount, energyType } = req.body;
        const txHash = await marketplaceService.retireTokens(userPrivateKey, amount, energyType);
        res.json({ success: true, txHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Marketplace Info ---
exports.getProducerInfo = async (req, res) => {
    try {
        const info = await marketplaceService.getProducerInfo(req.params.address);
        res.json(info);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getBalance = async (req, res) => {
    try {
        const balance = await marketplaceService.getRECBalance(req.params.address, req.params.energyType);
        res.json({ balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getListing = async (req, res) => {
    try {
        const listing = await marketplaceService.getListing(req.params.id);
        res.json(listing);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.syncEnsHistory = async (req, res) => {
    try {
        const { userAddress, key, actionData } = req.body;
        if (!userAddress || !key || !actionData) return res.status(400).json({ error: "Missing required fields" });
        await marketplaceService.syncEnsHistoryManual(userAddress, key, actionData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- AI Chat Service ---
exports.aiChat = async (req, res) => {
    try {
        const { input } = req.body;
        if (!input) return res.status(400).json({ error: "Input required" });
        const result = await aiService.parseIntent(input);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Fileverse Service ---
exports.uploadMetadata = async (req, res) => {
    try {
        const { metadata } = req.body;
        const hash = await fileverseService.uploadMetadata(metadata);
        res.json({ hash, url: fileverseService.getDocUrl(hash) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Reclaim Service ---
exports.initReclaim = async (req, res) => {
    try {
        const { url } = req.body;
        const result = await reclaimService.initializeVerification(url);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReclaimStatus = (req, res) => {
    const session = reclaimService.getSessionStatus(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json({ status: session.status, proofs: session.proofs, error: session.error });
};
