const { ethers, ethProvider } = require('../config/ethers');

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const PUBLIC_RESOLVER = "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD";

const REGISTRY_ABI = [
    "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
    "function setOwner(bytes32 node, address owner) external",
    "function owner(bytes32 node) view returns (address)",
];
const RESOLVER_ABI = [
    "function setAddr(bytes32 node, address addr) external",
    "function setText(bytes32 node, string key, string value) external",
];

const registerSubdomain = async (label, userAddress) => {
    const ENS_OWNER_PRIVATE_KEY = process.env.ENS_OWNER_PRIVATE_KEY;
    if (!ENS_OWNER_PRIVATE_KEY) throw new Error("ENS_OWNER_PRIVATE_KEY not configured");

    const ownerWallet = new ethers.Wallet(ENS_OWNER_PRIVATE_KEY, ethProvider);
    const registry = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, ownerWallet);
    const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, ownerWallet);

    const fullName = `${label.toLowerCase()}.rec.eth`;
    const PARENT_NODE = ethers.utils.namehash("rec.eth");
    const labelHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label.toLowerCase()));
    const subnode = ethers.utils.namehash(fullName);

    // Check availability
    const currentOwner = await registry.owner(subnode);
    if (currentOwner !== ethers.constants.AddressZero && 
        currentOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
        throw new Error(`${fullName} is already taken!`);
    }

    // 1. Provision Subdomain - Set owner as system wallet so we can update records later
    const tx1 = await registry.setSubnodeRecord(PARENT_NODE, labelHash, ownerWallet.address, PUBLIC_RESOLVER, 0, { gasLimit: 200000 });
    await tx1.wait();

    // 2. Set Addr to User Address (The "owner" in terms of resolution)
    const tx2 = await resolver.setAddr(subnode, userAddress, { gasLimit: 100000 });
    await tx2.wait();

    // 3. Set Name Text
    const txName = await resolver.setText(subnode, "name", fullName, { gasLimit: 100000 });
    await txName.wait();

    // NOTE: We do NOT hand over registry ownership (setOwner) to the userAddress here.
    // This allows the system wallet to update history records (listing/buy) on-chain 
    // without requiring the user to switch to Sepolia or pay gas.

    return { fullName, subnode, txHashes: [tx1.hash, tx2.hash, txName.hash] };
};

const systemUpdateTextRecord = async (subnode, key, value) => {
    const ENS_OWNER_PRIVATE_KEY = process.env.ENS_OWNER_PRIVATE_KEY;
    if (!ENS_OWNER_PRIVATE_KEY) throw new Error("ENS_OWNER_PRIVATE_KEY not configured");

    const ownerWallet = new ethers.Wallet(ENS_OWNER_PRIVATE_KEY, ethProvider);
    const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, ownerWallet);
    
    let node = subnode;
    if (typeof subnode === 'string' && !subnode.startsWith('0x')) {
        node = ethers.utils.namehash(subnode);
    }

    const tx = await resolver.setText(node, key, value, { gasLimit: 200000 });
    await tx.wait();
    return tx.hash;
};

const updateTextRecord = async (userPrivateKey, subnode, key, value) => {
    const userWallet = new ethers.Wallet(userPrivateKey, ethProvider);
    const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_ABI, userWallet);
    
    let node = subnode;
    if (typeof subnode === 'string' && !subnode.startsWith('0x')) {
        node = ethers.utils.namehash(subnode);
    }

    const tx = await resolver.setText(node, key, value, { gasLimit: 200000 });
    await tx.wait();
    return tx.hash;
};

const getTextRecord = async (subnode, key) => {
    const RESOLVER_READ_ABI = [
        "function text(bytes32 node, string key) view returns (string)",
    ];
    const resolver = new ethers.Contract(PUBLIC_RESOLVER, RESOLVER_READ_ABI, ethProvider);
    
    let node = subnode;
    if (typeof subnode === 'string' && !subnode.startsWith('0x')) {
        node = ethers.utils.namehash(subnode);
    }
    
    return await resolver.text(node, key);
};

module.exports = {
    registerSubdomain,
    updateTextRecord,
    systemUpdateTextRecord,
    getTextRecord
};
