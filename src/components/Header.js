import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, LogOut, LayoutDashboard, Shield, UserPlus, Loader2, X, Building2, User, Check, Settings2, ChevronDown, PlusCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { useMQTTContext } from '../context/MQTTContext';

const Header = () => {
  const { account, ensName, role, connectWallet, logout, contract, updateUserInfo, switchNetwork, BASE_CHAIN_ID } = useAuth();
  const { connected } = useMQTTContext();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [formData, setFormData] = useState({
      label: '',
      isProducer: false,
      gst: '',
      location: '',
      energyTypes: ''
  });

  // Constants for ENS
  const ENS_REGISTRY    = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
  const PUBLIC_RESOLVER = "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD";

  const REGISTRY_ABI = [
      "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
      "function setOwner(bytes32 node, address owner) external",
      "function owner(bytes32 node) view returns (address)",
  ];
  const handleSyncENSRecords = useCallback(async () => {
    if (!ensName || !account) {
        toast.warning("No ENS identity linked to sync.");
        return;
    }
    setIsSyncing(true);
    try {
        const sepoliaProvider = new ethers.providers.JsonRpcProvider(
            process.env.REACT_APP_ETH_SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com"
        );
        const node = ethers.utils.namehash(ensName);
        const registry = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, sepoliaProvider);
        const nodeOwner = await registry.owner(node);
        
        const backendPK = process.env.REACT_APP_OWNER_PRIVATE_KEY;
        const backendWallet = backendPK ? new ethers.Wallet(backendPK, sepoliaProvider) : null;

        // 1. Fetch Latest Stats from Base (Always needed)
        toast.info("Fetching fresh marketplace stats...");
        const baseSepoliaProvider = new ethers.providers.JsonRpcProvider(
            process.env.REACT_APP_BASE_RPC_URL || "https://sepolia.base.org"
        );
        const MARKETPLACE_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
        const baseContract = new ethers.Contract(MARKETPLACE_ADDRESS, [
            "function getActiveListings() view returns (tuple(uint256 id, address seller, uint256 amount, uint256 pricePerToken, string energyType, string location, bool active, uint8 creditRatio)[])",
            "function getProducerInfo(address p) view returns (tuple(string gst, string location, string energyTypes, bool verified, uint256 totalMinted))"
        ], baseSepoliaProvider);

        const [activeListings, pInfo] = await Promise.all([
            baseContract.getActiveListings().catch(() => []),
            role === 'PRODUCER' ? baseContract.getProducerInfo(account).catch(() => null) : Promise.resolve(null)
        ]);

        const myCount = activeListings.filter(l => l.seller.toLowerCase() === account.toLowerCase()).length;
        const totalMinted = pInfo ? pInfo.totalMinted.toString() : "0";
        const desc = role === 'PRODUCER' ? "Verified Renewable Energy Producer" : "Renewable Energy Consumer";

        // 2. Decide Signer
        let finalSigner;
        if (backendWallet && nodeOwner.toLowerCase() === backendWallet.address.toLowerCase()) {
            toast.info("Syncing via backend wallet...");
            finalSigner = backendWallet;
        } else if (nodeOwner.toLowerCase() === account.toLowerCase()) {
            const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
            if (parseInt(chainIdHex, 16) !== 11155111) {
                // Save data to localStorage so user can click Sync again after reload
                const syncData = { ensName, desc, myCount, totalMinted, timestamp: Date.now() };
                localStorage.setItem(`pending_ens_sync_${account}`, JSON.stringify(syncData));
                
                toast.info("Switching to Ethereum Sepolia. Please click Sync again after the page reloads.");
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0xaa36a7' }], 
                });
                setIsSyncing(false);
                return;
            }
            finalSigner = (new ethers.providers.Web3Provider(window.ethereum)).getSigner();
        } else {
            throw new Error(`Permission Denied: Name owned by ${nodeOwner.slice(0,6)}...`);
        }

        const resolver = new ethers.Contract(PUBLIC_RESOLVER, [
            "function setText(bytes32 node, string key, string value) external"
        ], finalSigner);

        // 3. Update Records
        toast.info(`Pushing updates to ${ensName}...`);
        
        const tx1 = await resolver.setText(node, "description", desc, { gasLimit: 80000 });
        toast.info("Updating Description...");
        await tx1.wait();

        const tx2 = await resolver.setText(node, "activeListings", myCount.toString(), { gasLimit: 80000 });
        toast.info("Updating Listings Count...");
        await tx2.wait();

        if (role === 'PRODUCER') {
            const tx3 = await resolver.setText(node, "totalMinted", totalMinted, { gasLimit: 80000 });
            toast.info("Updating Production Stats...");
            await tx3.wait();
        }

        const tx4 = await resolver.setText(node, "lastSynced", new Date().toLocaleString(), { gasLimit: 80000 });
        await tx4.wait();

        localStorage.removeItem(`pending_ens_sync_${account}`);
        toast.success("🎉 ENS Profile Synced Successfully!");
    } catch (err) {
        console.error("ENS Sync Error:", err);
        toast.error("Sync failed: " + (err.reason || err.message));
    } finally {
        setIsSyncing(false);
    }
  }, [account, ensName, role]);

  const handleDashboard = () => {
    setShowDropdown(false);
    if (role === 'PRODUCER') navigate('/producer/dashboard');
    else if (role === 'BUYER') navigate('/consumer/dashboard');
    else navigate('/register');
  };

  const openIdentityModal = (asProducer = false) => {
    setFormData(prev => ({ ...prev, isProducer: asProducer }));
    setShowRegModal(true);
    setShowDropdown(false);
  };

  const resetModal = () => {
      setShowRegModal(false);
      setRegStep(1);
      setFormData({ label: '', isProducer: false, gst: '', location: '', energyTypes: '' });
  };

  // Auto-resume sync after network-switch reload
  React.useEffect(() => {
    const resumeSync = async () => {
        if (!account) return;
        const pending = localStorage.getItem(`pending_ens_sync_${account}`);
        if (pending) {
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (parseInt(currentChainId, 16) === 11155111) {
                console.log("DEBUG: Resuming pending ENS sync...");
                handleSyncENSRecords();
            }
        }
    };
    resumeSync();
  }, [account, handleSyncENSRecords]);

  const handleNextStep = () => {
      if (!formData.label) {
          toast.error("Please enter a subdomain label");
          return;
      }
      if (formData.isProducer) {
          setRegStep(2);
      } else {
          startRegistrationFlow();
      }
  };

  const startRegistrationFlow = async () => {
    const label = formData.label.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const fullName = `${label}.rec.eth`;
    const isProducer = formData.isProducer;
    
    // Clear existing local state to allow fresh registration
    localStorage.removeItem(`ensName_${account}`);
    localStorage.removeItem(`role_${account}`);
    
    setShowRegModal(false);
    setIsRegistering(true);

    try {
        // ── STEP 1: ENS ON ETHEREUM SEPOLIA ──────────────────────────
        const ENS_REGISTRY    = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
        const PUBLIC_RESOLVER = "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD";

        const REGISTRY_ABI = [
            "function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external",
            "function setOwner(bytes32 node, address owner) external",
            "function owner(bytes32 node) view returns (address)",
        ];

        const sepoliaProvider = new ethers.providers.JsonRpcProvider(
            process.env.REACT_APP_ETH_SEPOLIA_RPC || "https://ethereum-sepolia.publicnode.com"
        );

        const ownerWallet = new ethers.Wallet(
            process.env.REACT_APP_OWNER_PRIVATE_KEY,
            sepoliaProvider
        );

        const registry = new ethers.Contract(ENS_REGISTRY, REGISTRY_ABI, ownerWallet);
        const resolver = new ethers.Contract(PUBLIC_RESOLVER, [
            "function setAddr(bytes32 node, address addr) external",
            "function setText(bytes32 node, string key, string value) external",
        ], ownerWallet);

        const PARENT_NODE = ethers.utils.namehash("rec.eth");
        const labelHash   = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));
        const subnode     = ethers.utils.namehash(fullName);

        const currentOwner = await registry.owner(subnode);
        if (currentOwner !== ethers.constants.AddressZero && 
            currentOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
            throw new Error(`${fullName} is already taken!`);
        }

        toast.info(`Step 1/3: Provisioning ${fullName} on Ethereum...`);
        
        const tx1 = await registry.setSubnodeRecord(PARENT_NODE, labelHash, ownerWallet.address, PUBLIC_RESOLVER, 0, { gasLimit: 200000 });
        await tx1.wait();

        const tx2 = await resolver.setAddr(subnode, account, { gasLimit: 100000 });
        await tx2.wait();

        const txName = await resolver.setText(subnode, "name", fullName, { gasLimit: 100000 });
        await txName.wait();

        // RE-ADDED: Set the user as the registry owner of the subnode
        // The system wallet can still update it later because it owns 'rec.eth' (the parent)
        const tx3 = await registry.setSubnodeOwner(PARENT_NODE, labelHash, account, { gasLimit: 100000 });
        await tx3.wait();
        
        toast.success("ENS Subdomain Provisioned!");

        // ── STEP 2: SWITCH TO BASE SEPOLIA ──────────────────────────
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (parseInt(currentChainId, 16) !== parseInt(BASE_CHAIN_ID)) {
            toast.info("Step 2/3: Switching to Base Sepolia...");
            const switched = await switchNetwork(BASE_CHAIN_ID);
            if (!switched) throw new Error("Switch to Base Sepolia failed");
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // ── STEP 3: MARKETPLACE REGISTRATION ─────────────────────────
        toast.info("Step 3/3: Finalizing Marketplace Identity...");
        
        if (isProducer) {
            const info = await contract.getProducerInfo(account).catch(() => null);
            // In new ABI, info is a tuple (gst, location, energyTypes, verified, totalMinted)
            if (!info || !info.verified) {
                const regTx = await contract.registerProducer(formData.gst, formData.location, formData.energyTypes);
                await regTx.wait();
            }
        } else {
            // Check if buyer is already registered via getBuyerInfo
            const bInfo = await contract.getBuyerInfo(account).catch(() => null);
            if (!bInfo || !bInfo.registered) {
                const regTx = await contract.registerBuyer();
                await regTx.wait();
            }
        }

        // ── STEP 4: LINK ENS IDENTITY ────────────────────────────────
        const node = ethers.utils.namehash(fullName);
        const roleValue = isProducer ? 1 : 2;

        await contract.callStatic.registerENSIdentity(fullName, roleValue, node)
            .catch(e => { throw new Error("Linking failed: " + (e.reason || e.message)); });

        const tx4 = await contract.registerENSIdentity(fullName, roleValue, node, { gasLimit: 500000 });
        await tx4.wait();

        // ── STEP 5: CACHE & FINALIZE ────────────────────────────────
        localStorage.setItem(`ensName_${account}`, fullName);
        localStorage.setItem(`role_${account}`, isProducer ? 'PRODUCER' : 'BUYER');

        toast.success(`🎉 Identity updated to ${fullName}!`);
        await updateUserInfo();
        resetModal();
        navigate('/register');

    } catch (err) {
        console.error("Registration flow error:", err);
        toast.error(err.reason || err.message || "Failed");
        resetModal();
    } finally {
        setIsRegistering(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group relative">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                <span className="text-slate-900 font-bold">R</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                REC Marketplace
              </span>
              {/* Bridge Connection Indicator */}
              <div 
                className={`absolute -top-1 -right-3 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${connected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}
                title={connected ? "IoT Bridge Connected" : "IoT Bridge Offline"}
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/community" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors">Community</Link>
              <Link to="/events" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors">Events</Link>
              <Link to="/shop" className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors">Impact Tracker</Link>
            </nav>

            <div className="flex items-center gap-4">
              {account ? (
                <div className="flex items-center gap-3">
                  {/* Icon-only Identity Button */}
                  <button 
                      onClick={() => openIdentityModal(role === 'BUYER')}
                      disabled={isRegistering}
                      className="p-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all shadow-lg shadow-cyan-500/5"
                      title={ensName ? "Change Identity" : "Claim .eth"}
                  >
                      {isRegistering ? <Loader2 size={16} className="animate-spin" /> : (ensName ? <Settings2 size={16} /> : <UserPlus size={16} />)}
                  </button>

                  {/* ENS Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all"
                    >
                      <LayoutDashboard size={16} className="text-emerald-400" />
                      <span className="text-xs font-medium text-slate-300 truncate max-w-[100px]">
                        {ensName || `${account.slice(0, 6)}...${account.slice(-4)}`}
                      </span>
                      <ChevronDown size={12} className={`text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 border-b border-slate-800 mb-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Connected Wallet</p>
                          <p className="text-xs text-slate-300 truncate font-mono">{account}</p>
                        </div>
                        
                        <button onClick={handleDashboard} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors text-left">
                          <LayoutDashboard size={16} />
                          Go to Dashboard
                        </button>

                        {ensName && (
                          <button 
                            onClick={handleSyncENSRecords} 
                            disabled={isSyncing}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors text-left"
                          >
                            {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Sync ENS Records
                          </button>
                        )}

                        <div className="h-px bg-slate-800 my-1" />

                        {!ensName ? (
                          <button onClick={() => openIdentityModal(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left font-bold">
                            <PlusCircle size={16} />
                            Claim .eth Identity
                          </button>
                        ) : (
                          <>
                            {role === 'BUYER' && (
                              <button onClick={() => openIdentityModal(true)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left">
                                <Building2 size={16} />
                                Add Producer Identity
                              </button>
                            )}
                            {role === 'PRODUCER' && (
                              <button onClick={() => openIdentityModal(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-cyan-400 hover:bg-cyan-500/10 transition-colors text-left">
                                <User size={16} />
                                Add Consumer Identity
                              </button>
                            )}
                          </>
                        )}

                        <div className="h-px bg-slate-800 my-1" />
                        
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left">
                          <LogOut size={16} />
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={connectWallet}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <Wallet size={16} />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modern Registration Modal */}
      {showRegModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
              <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-400">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-2xl font-black text-white">{ensName ? "Update Identity" : "Claim Web3 Identity"}</h3>
                      </div>
                      <button onClick={resetModal} className="p-2 text-slate-500 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  {regStep === 1 ? (
                      <div className="space-y-8">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">New Subdomain Label</label>
                              <div className="relative group">
                                  <input 
                                      type="text"
                                      placeholder="e.g. saachi-solar"
                                      value={formData.label}
                                      onChange={(e) => setFormData({...formData, label: e.target.value})}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-4 pr-24 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                  />
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold group-focus-within:text-cyan-400 transition-colors">.rec.eth</div>
                              </div>
                              {ensName && <p className="mt-2 text-[10px] text-amber-400 font-bold">Note: This will overwrite your current identity: {ensName}</p>}
                          </div>

                          <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Confirm Role</label>
                              <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => setFormData({...formData, isProducer: true})} className={`p-6 rounded-3xl border-2 transition-all text-left group ${formData.isProducer ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                                      <Building2 className={`mb-3 ${formData.isProducer ? 'text-emerald-400' : 'text-slate-500'}`} size={24} />
                                      <div className="font-bold text-white mb-1">Producer</div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Generate & Sell</div>
                                  </button>
                                  <button onClick={() => setFormData({...formData, isProducer: false})} className={`p-6 rounded-3xl border-2 transition-all text-left group ${!formData.isProducer ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}>
                                      <User className={`mb-3 ${!formData.isProducer ? 'text-cyan-400' : 'text-slate-500'}`} size={24} />
                                      <div className="font-bold text-white mb-1">Buyer</div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Buy & Offset</div>
                                  </button>
                              </div>
                          </div>

                          <button onClick={handleNextStep} className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                              {formData.isProducer ? "Continue to Details" : "Register New Identity"}
                              <Check size={18} />
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                          <div className="grid gap-6">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">GST Number</label>
                                  <input type="text" placeholder="e.g. 27AAACR1234A1Z1" value={formData.gst} onChange={(e) => setFormData({...formData, gst: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:border-emerald-500/50 focus:outline-none" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Facility Location</label>
                                  <input type="text" placeholder="e.g. Maharashtra, India" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:border-emerald-500/50 focus:outline-none" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Energy Types</label>
                                  <input type="text" placeholder="e.g. Solar, Wind" value={formData.energyTypes} onChange={(e) => setFormData({...formData, energyTypes: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-white focus:border-emerald-500/50 focus:outline-none" />
                              </div>
                          </div>
                          <div className="flex gap-4 pt-4">
                              <button onClick={() => setRegStep(1)} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all">Back</button>
                              <button onClick={startRegistrationFlow} className="flex-[2] py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">Finalize Update <Check size={18} /></button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </>
  );
};

export default Header;
