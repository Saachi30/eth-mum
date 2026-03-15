const { ethers } = require('ethers');
const abi = require('./abi.json');

const ETH_SEPOLIA_RPC = process.env.ETH_SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com";
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS || "0xCD0cF33577e210c6Bbd48eBafa9473123e88b15b";

const ethProvider = new ethers.providers.JsonRpcProvider(ETH_SEPOLIA_RPC);
const baseProvider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);

const getMarketplaceContract = (signerOrProvider) => {
    return new ethers.Contract(MARKETPLACE_ADDRESS, abi, signerOrProvider);
};

module.exports = {
    ethProvider,
    baseProvider,
    getMarketplaceContract,
    ethers
};
