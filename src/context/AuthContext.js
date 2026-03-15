import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import abi from '../abi.json';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0xCD0cF33577e210c6Bbd48eBafa9473123e88b15b";
const ENS_MANAGER_ADDRESS = process.env.REACT_APP_ENS_SUBDOMAIN_MANAGER;
const BASE_CHAIN_ID = process.env.REACT_APP_BASE_CHAIN_ID || "84532"; 

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [ensName, setEnsName] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userInfo, setUserInfo] = useState(null);
    const [role, setRole] = useState(null);
    
    const isConnecting = useRef(false);
    const accountRef = useRef(null);
    const contractRef = useRef(null);

    useEffect(() => { accountRef.current = account; }, [account]);
    useEffect(() => { contractRef.current = contract; }, [contract]);

    const updateUserInfo = useCallback(async (addr, contractInstance) => {
        if (!addr || !contractInstance) return;
        try {
            const provider = contractInstance.provider;
            const network = await provider.getNetwork();
            const chainId = network.chainId;
            
            if (parseInt(chainId) !== parseInt(BASE_CHAIN_ID)) {
                return;
            }

            const code = await provider.getCode(contractInstance.address).catch(() => '0x');
            if (code === '0x' || code === '0x0') return;

            const identity = await contractInstance.ensIdentities(addr).catch(() => null);

            if (identity && identity.linked) {
                // ✅ Found on-chain - Sync to state and cache
                setEnsName(identity.username);
                const roleEnum = identity.role;
                const roleStr = roleEnum === 1 ? 'PRODUCER' : roleEnum === 2 ? 'BUYER' : null;
                setRole(roleStr);
                
                localStorage.setItem(`ensName_${addr}`, identity.username);
                if (roleStr) localStorage.setItem(`role_${addr}`, roleStr);

                if (roleEnum === 1) {
                    const info = await contractInstance.getProducerInfo(addr).catch(() => null);
                    setUserInfo({ ...identity, ...info });
                } else {
                    setUserInfo(identity);
                }
            } else {
                // 🔄 Not found on-chain yet - check local cache for immediate UI update
                const cachedName = localStorage.getItem(`ensName_${addr}`);
                const cachedRole = localStorage.getItem(`role_${addr}`);
                
                if (cachedName) {
                    setEnsName(cachedName);
                    setRole(cachedRole || null);
                } else {
                    setEnsName(null);
                    setRole(null);
                    setUserInfo(null);
                }
            }
        } catch (error) {
            console.error("Error in updateUserInfo:", error);
        }
    }, []);

    const switchNetwork = async (targetChainId) => {
        const hexChainId = '0x' + Number(targetChainId).toString(16);
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexChainId }],
            });

            const newProvider = new ethers.providers.Web3Provider(window.ethereum);
            await newProvider.ready;
            const newSigner = newProvider.getSigner();
            const newContract = new ethers.Contract(CONTRACT_ADDRESS, abi, newSigner);
            
            setProvider(newProvider);
            setSigner(newSigner);
            setContract(newContract);
            
            return true;
        } catch (switchError) {
            if (switchError.code === 4902) {
                toast.info("Please add the Base Sepolia network to MetaMask");
            }
            return false;
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum || isConnecting.current) return;
        
        try {
            isConnecting.current = true;
            setLoading(true);
            
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const addr = accounts[0];
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (parseInt(chainId, 16) !== parseInt(BASE_CHAIN_ID)) {
                const switched = await switchNetwork(BASE_CHAIN_ID);
                if (!switched) {
                    setLoading(false);
                    isConnecting.current = false;
                    return;
                }
                await new Promise(r => setTimeout(r, 1000));
            }

            const tempProvider = new ethers.providers.Web3Provider(window.ethereum);
            await tempProvider.ready;
            const tempSigner = tempProvider.getSigner();
            const tempContract = new ethers.Contract(CONTRACT_ADDRESS, abi, tempSigner);

            setAccount(addr);
            setProvider(tempProvider);
            setSigner(tempSigner);
            setContract(tempContract);

            await updateUserInfo(addr, tempContract);
            setLoading(false);
            isConnecting.current = false;
            return addr;
        } catch (error) {
            console.error("Connection error:", error);
            setLoading(false);
            isConnecting.current = false;
        }
    };

    const logout = () => {
        if (account) {
            localStorage.removeItem(`ensName_${account}`);
            localStorage.removeItem(`role_${account}`);
        }
        setAccount(null);
        setEnsName(null);
        setProvider(null);
        setSigner(null);
        setContract(null);
        setUserInfo(null);
        setRole(null);
    };

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    await connectWallet();
                } else {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        init();

        if (window.ethereum) {
            const handleAccounts = (accounts) => {
                if (accounts.length > 0) connectWallet();
                else logout();
            };
            const handleChain = () => window.location.reload();

            window.ethereum.on('accountsChanged', handleAccounts);
            window.ethereum.on('chainChanged', handleChain);

            return () => {
                window.ethereum.removeListener('accountsChanged', handleAccounts);
                window.ethereum.removeListener('chainChanged', handleChain);
            };
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Identity Polling - ensures frontend updates even if blockchain is slow
    useEffect(() => {
        if (!account || !contract || (ensName && role)) return;
        const interval = setInterval(() => {
            updateUserInfo(account, contract);
        }, 5000);
        return () => clearInterval(interval);
    }, [account, contract, ensName, role, updateUserInfo]);

    const value = {
        account,
        ensName,
        provider,
        signer,
        contract,
        loading,
        role,
        userInfo,
        ENS_MANAGER_ADDRESS,
        BASE_CHAIN_ID,
        connectWallet,
        logout,
        switchNetwork,
        updateUserInfo: () => updateUserInfo(accountRef.current, contractRef.current)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
