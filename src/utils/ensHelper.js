import { ethers } from 'ethers';
import ensAbi from '../ensabi.json';

const ETH_SEPOLIA_RPC = process.env.REACT_APP_ETH_SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com";
// Use custom registry/manager and resolver from env
const ENS_REGISTRY    = process.env.REACT_APP_ENS_SUBDOMAIN_MANAGER || "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const PUBLIC_RESOLVER = process.env.REACT_APP_ENS_RESOLVER_ADDRESS || "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD";
const ROOT_NODE       = ethers.utils.namehash("rec.eth");

export const getEnsTextRecord = async (ensName, key) => {
    try {
        const provider = new ethers.providers.JsonRpcProvider(ETH_SEPOLIA_RPC);
        const resolver = new ethers.Contract(PUBLIC_RESOLVER, ensAbi.resolver, provider);
        const node = ethers.utils.namehash(ensName);
        return await resolver.text(node, key);
    } catch (error) {
        console.error("Error fetching ENS text record:", error);
        return null;
    }
};

/**
 * "Jugaad" Update using specific ENS Manager/Registry contract
 * 1. System wallet takes temporary ownership of subnode via setSubnodeOwner
 * 2. System wallet sets text record on Resolver
 * 3. System wallet returns ownership to user
 */
export const updateEnsTextRecord = async (ensName, userAddress, key, value) => {
    try {
        const backendPK = process.env.REACT_APP_OWNER_PRIVATE_KEY;
        if (!backendPK) {
            console.warn("DEBUG: No backend PK found for ENS sync. Ensure REACT_APP_OWNER_PRIVATE_KEY is set.");
            return null;
        }

        const provider = new ethers.providers.JsonRpcProvider(ETH_SEPOLIA_RPC);
        const wallet = new ethers.Wallet(backendPK, provider);
        
        // Connect to Registry and Resolver using custom ABIs
        const registry = new ethers.Contract(ENS_REGISTRY, ensAbi.registry, wallet);
        const resolver = new ethers.Contract(PUBLIC_RESOLVER, ensAbi.resolver, wallet);
        
        const label = ensName.split('.')[0];
        const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
        const node = ethers.utils.namehash(ensName);

        console.log(`DEBUG: [JUGAAD] Syncing ENS for ${ensName} through contract ${ENS_REGISTRY}`);

        // Step 1: Temporarily reclaim ownership from user to system wallet
        // System wallet must own ROOT_NODE (rec.eth) for this to work
        const tx1 = await registry.setSubnodeOwner(ROOT_NODE, labelHash, wallet.address, { gasLimit: 150000 });
        console.log("DEBUG: Step 1/3 (Reclaim) transaction sent:", tx1.hash);
        await tx1.wait();

        // Step 2: Set the text record on the resolver
        const tx2 = await resolver.setText(node, key, value, { gasLimit: 150000 });
        console.log("DEBUG: Step 2/3 (SetText) transaction sent:", tx2.hash);
        await tx2.wait();

        // Step 3: Return ownership back to the user
        const tx3 = await registry.setSubnodeOwner(ROOT_NODE, labelHash, userAddress, { gasLimit: 150000 });
        console.log("DEBUG: Step 3/3 (Return) transaction sent:", tx3.hash);
        await tx3.wait();

        console.log(`DEBUG: [SUCCESS] ENS text record updated and ownership returned to ${userAddress}`);
        return tx2.hash;
    } catch (error) {
        console.error("Error in ENS Jugaad sync:", error);
        throw error;
    }
};

export const syncActionToEns = async (ensName, userAddress, key, actionData) => {
    if (!ensName || !userAddress) return;
    
    try {
        const currentHistory = await getEnsTextRecord(ensName, key);
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

        // Limit to last 5 items to manage record size
        if (historyArray.length > 5) historyArray = historyArray.slice(-5);

        return await updateEnsTextRecord(ensName, userAddress, key, JSON.stringify(historyArray));
    } catch (error) {
        console.error(`Failed to sync ${key} to ENS:`, error);
    }
};
