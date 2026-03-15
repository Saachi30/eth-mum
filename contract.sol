// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RECDominator is ERC20, Ownable {

    enum Role { NONE, PRODUCER, BUYER }

    struct ENSIdentity {
        string username;
        Role role;
        bytes32 sepoliaSubnode;
        bool linked;
    }

    struct ProducerInfo {
        string gst;
        string location;
        string energyTypes;
        bool verified;
        uint256 totalMinted;
    }

    struct BuyerInfo {
        bool registered;
        bool approved;
        uint256 totalBought;
        uint256 totalRetired;
    }

    struct Listing {
        uint256 id;
        address seller;
        uint256 amount;
        uint256 pricePerToken;
        string energyType;
        string location;
        bool active;
        uint8 creditRatio;
    }

    struct TradeReceipt {
        address counterparty;
        uint256 amount;
        uint256 pricePerToken;
        string energyType;
        bytes32 fileverseDocHash;
        uint256 timestamp;
        bool retired;
        bytes32 carbonCreditHash;
    }

    // --- Public mappings ---
    mapping(address => ENSIdentity) public ensIdentities;
    mapping(address => uint256)     public dummyCredits;

    // --- Private state ---
    mapping(address => ProducerInfo)               private _producers;
    mapping(address => BuyerInfo)                  private _buyers;
    mapping(uint256 => Listing)                    private _listings;
    mapping(address => mapping(string => uint256)) private _recBal;
    mapping(address => TradeReceipt[])             private _buyHist;
    mapping(address => TradeReceipt[])             private _sellHist;
    mapping(address => uint256)                    private _ccBal;

    uint256[] private _listingIds;
    uint256   private _nextId = 1;

    uint256 private constant _CC_MINT   = 10;
    uint256 private constant _CC_SALE   =  5;
    uint256 private constant _CC_BUY    =  3;
    uint256 private constant _CC_RETIRE = 15;

    // --- Events ---
    event ENSLinked(address indexed u, string username, Role role);
    event ProducerReg(address indexed p);
    event BuyerReg(address indexed b);
    event BuyerApproved(address indexed b);
    event Minted(address indexed p, uint256 amt, string eType);
    event Retired(address indexed u, uint256 amt, string eType);
    event Listed(uint256 indexed id, address indexed seller, uint256 amt);
    event Cancelled(uint256 indexed id);
    event Bought(address indexed buyer, uint256 indexed id, uint256 amt);
    event CCAwarded(address indexed u, uint256 amt, string reason);

    constructor(address initialOwner)
        ERC20("GreenREC", "REC")
        Ownable(initialOwner)
    {}

    // ── Admin ────────────────────────────────────────────────

    function giveDummyCredits(address user, uint256 amt) external onlyOwner {
        dummyCredits[user] += amt;
    }

    function approveBuyer(address buyer) external onlyOwner {
        require(_buyers[buyer].registered, "!");
        _buyers[buyer].approved = true;
        emit BuyerApproved(buyer);
    }

    // ── ENS ──────────────────────────────────────────────────

    function registerENSIdentity(
        string calldata username,
        Role role,
        bytes32 subnode
    ) external {
        ensIdentities[msg.sender] = ENSIdentity(username, role, subnode, true);
        emit ENSLinked(msg.sender, username, role);
    }

    function getENSIdentity(address user)
        external view returns (ENSIdentity memory)
    { return ensIdentities[user]; }

    // ── Producer ─────────────────────────────────────────────

    function registerProducer(
        string calldata gst,
        string calldata location,
        string calldata energyTypes
    ) external {
        _producers[msg.sender] = ProducerInfo(gst, location, energyTypes, true, 0);
        emit ProducerReg(msg.sender);
    }

    // ── Buyer ─────────────────────────────────────────────────

    function registerBuyer() external {
        require(!_buyers[msg.sender].registered, "!");
        _buyers[msg.sender] = BuyerInfo({
            registered:   true,
            approved:     false,
            totalBought:  0,
            totalRetired: 0
        });
        emit BuyerReg(msg.sender);
    }

    // ── Mint ──────────────────────────────────────────────────

    function mintTokens(
        uint256 amt,
        string calldata eType
    ) external {
        require(_producers[msg.sender].verified, "!");
        _mint(msg.sender, amt);
        _recBal[msg.sender][eType]         += amt;
        _producers[msg.sender].totalMinted += amt;
        _award(msg.sender, amt * _CC_MINT, "mint");
        emit Minted(msg.sender, amt, eType);
    }

    // ── Retire ────────────────────────────────────────────────

    function retireTokens(uint256 amt, string calldata eType) external {
        require(_recBal[msg.sender][eType] >= amt, "!");
        _recBal[msg.sender][eType]       -= amt;
        _burn(msg.sender, amt);
        _buyers[msg.sender].totalRetired += amt;
        _award(msg.sender, amt * _CC_RETIRE, "retire");
        emit Retired(msg.sender, amt, eType);
    }

    // ── Marketplace ───────────────────────────────────────────

    function listTokens(
        uint256 amt,
        uint256 price,
        string calldata eType,
        uint8 creditRatio
    ) external {
        require(_recBal[msg.sender][eType] >= amt, "!");
        require(creditRatio <= 100, "!");
        require(
            creditRatio == 0 || bytes(_producers[msg.sender].gst).length > 0,
            "!"
        );
        _recBal[msg.sender][eType] -= amt;
        _listings[_nextId] = Listing({
            id:            _nextId,
            seller:        msg.sender,
            amount:        amt,
            pricePerToken: price,
            energyType:    eType,
            location:      _producers[msg.sender].location,
            active:        true,
            creditRatio:   creditRatio
        });
        _listingIds.push(_nextId);
        emit Listed(_nextId, msg.sender, amt);
        _nextId++;
    }

    function cancelListing(uint256 id) external {
        Listing storage l = _listings[id];
        require(l.seller == msg.sender && l.active, "!");
        l.active = false;
        _recBal[msg.sender][l.energyType] += l.amount;
        emit Cancelled(id);
    }

    function buyTokens(
        uint256 id,
        uint256 amt,
        bytes32 fdHash,
        bytes32 ccHash
    ) external {
        require(_buyers[msg.sender].approved, "!");
        Listing storage l = _listings[id];
        require(l.active && l.amount >= amt, "!");

        // Buyer always pays full price
        uint256 cost = l.pricePerToken * amt;
        require(dummyCredits[msg.sender] >= cost, "!");

        dummyCredits[msg.sender] -= cost;
        dummyCredits[l.seller]   += cost;

        l.amount -= amt;
        if (l.amount == 0) l.active = false;

        _recBal[msg.sender][l.energyType] += amt;
        _buyers[msg.sender].totalBought   += amt;

        // Seller CC award is scaled by creditRatio they set on the listing
        // e.g. creditRatio=20 → seller earns 20% of normal CC_SALE reward
        uint256 sellerCC = (amt * _CC_SALE * l.creditRatio) / 100;
        _award(l.seller,   sellerCC,        "sell");
        _award(msg.sender, amt * _CC_BUY,   "buy");

        TradeReceipt memory r = TradeReceipt({
            counterparty:     msg.sender,
            amount:           amt,
            pricePerToken:    l.pricePerToken,
            energyType:       l.energyType,
            fileverseDocHash: fdHash,
            timestamp:        block.timestamp,
            retired:          false,
            carbonCreditHash: ccHash
        });
        _sellHist[l.seller].push(r);
        r.counterparty = l.seller;
        _buyHist[msg.sender].push(r);

        emit Bought(msg.sender, id, amt);
    }

    // ── View / Getters ─────────────────────────────────────────

    function getRECBalance(address acct, string calldata eType)
        external view returns (uint256)
    { return _recBal[acct][eType]; }

    function getProducerInfo(address p)
        external view returns (ProducerInfo memory)
    { return _producers[p]; }

    function getBuyerInfo(address b)
        external view returns (BuyerInfo memory)
    { return _buyers[b]; }

    function getListing(uint256 id)
        external view returns (Listing memory)
    { return _listings[id]; }

    function getAllListings()
        external view returns (Listing[] memory)
    {
        Listing[] memory all = new Listing[](_listingIds.length);
        for (uint256 i; i < _listingIds.length; i++)
            all[i] = _listings[_listingIds[i]];
        return all;
    }

    function getActiveListings()
        external view returns (Listing[] memory)
    {
        uint256 n;
        for (uint256 i; i < _listingIds.length; i++)
            if (_listings[_listingIds[i]].active) n++;
        Listing[] memory out = new Listing[](n);
        uint256 j;
        for (uint256 i; i < _listingIds.length; i++)
            if (_listings[_listingIds[i]].active)
                out[j++] = _listings[_listingIds[i]];
        return out;
    }

    function getBuyingHistory(address b)
        external view returns (TradeReceipt[] memory)
    { return _buyHist[b]; }

    function getSellingHistory(address s)
        external view returns (TradeReceipt[] memory)
    { return _sellHist[s]; }

    function getCarbonCredits(address user)
        external view returns (uint256)
    {
        require(msg.sender == user || msg.sender == owner(), "!");
        return _ccBal[user];
    }

    // ── Internal ──────────────────────────────────────────────

    function _award(address user, uint256 amt, string memory reason) internal {
        _ccBal[user] += amt;
        emit CCAwarded(user, amt, reason);
    }
}