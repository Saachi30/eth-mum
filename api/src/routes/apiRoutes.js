const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// ENS
router.post('/ens/register', apiController.registerEns);

// Marketplace Identity
router.post('/marketplace/register-producer', apiController.registerProducer);
router.post('/marketplace/register-buyer', apiController.registerBuyer);
router.post('/marketplace/link-ens', apiController.linkEns);

// Token Actions
router.post('/marketplace/mint', apiController.mintTokens);
router.post('/marketplace/list', apiController.listTokens);
router.post('/marketplace/buy', apiController.buyTokens);
router.post('/marketplace/retire', apiController.retireTokens);

// Marketplace Getters
router.get('/marketplace/info/:address', apiController.getProducerInfo);
router.get('/marketplace/balance/:address/:energyType', apiController.getBalance);
router.get('/marketplace/listing/:id', apiController.getListing);

// AI / Chat
router.post('/ai/chat', apiController.aiChat);

// Fileverse
router.post('/fileverse/upload', apiController.uploadMetadata);

// Reclaim
router.post('/reclaim/init', apiController.initReclaim);
router.get('/reclaim/status/:sessionId', apiController.getReclaimStatus);

module.exports = router;
