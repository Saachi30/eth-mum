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

        bytes32 zkProofHash;

        bool active;

    }



    struct TradeReceipt {

        address counterparty;

        uint256 amount;

        uint256 pricePerToken;

        string energyType;

        bytes32 zkProofHash;

        bytes32 fileverseDocHash;

        uint256 timestamp;

        bool retired;

    }



    mapping(address => ENSIdentity) public ensIdentities;

    mapping(address => ProducerInfo) private producers;

    mapping(address => BuyerInfo) private buyers;



    mapping(uint256 => Listing) private listings;

    mapping(address => mapping(string => uint256)) private _recBalances;



    mapping(address => TradeReceipt[]) private buyingHistory;

    mapping(address => TradeReceipt[]) private sellingHistory;



    mapping(bytes32 => bool) public zkProofUsed;



    uint256 private nextListingId;



    // Dummy credit system

    mapping(address => uint256) public dummyCredits;



    // GreenPoints

    mapping(address => uint256) public greenPoints;



    uint256 private constant GP_PER_MINT = 10;

    uint256 private constant GP_PER_SALE = 5;

    uint256 private constant GP_PER_BUY = 3;

    uint256 private constant GP_PER_RETIRE = 15;



    // Leaderboard

    address[] private leaderboard;

    uint256 private constant LEADERBOARD_SIZE = 20;



    // EVENTS



    event ENSIdentityLinked(address user, string username, Role role);

    event ProducerRegistered(address producer);

    event BuyerRegistered(address buyer);

    event BuyerApproved(address buyer);



    event RECMinted(address producer, uint256 amount, string energyType);

    event RECRetired(address user, uint256 amount, string energyType);



    event ListingCreated(uint256 listingId, address seller, uint256 amount);

    event ListingCancelled(uint256 listingId);



    event RECBought(address buyer, uint256 listingId, uint256 amount);



    event GreenPointsAwarded(address user, uint256 points, string reason);



    constructor(address initialOwner)

        ERC20("GreenREC", "REC")

        Ownable(initialOwner)

    {

        nextListingId = 1;

    }



    // -----------------------------

    // Dummy Credits

    // -----------------------------



    function giveDummyCredits(address user, uint256 amount) external onlyOwner {

        dummyCredits[user] += amount;

    }



    function getDummyCredits(address user) external view returns(uint256){

        return dummyCredits[user];

    }



    // -----------------------------

    // ENS Identity

    // -----------------------------



    function registerENSIdentity(

        string calldata username,

        Role role,

        bytes32 sepoliaSubnode

    ) external {



        ensIdentities[msg.sender] = ENSIdentity({

            username: username,

            role: role,

            sepoliaSubnode: sepoliaSubnode,

            linked: true

        });



        emit ENSIdentityLinked(msg.sender, username, role);

    }



    // -----------------------------

    // Producer

    // -----------------------------



    function registerProducer(

        string calldata gst,

        string calldata location,

        string calldata energyTypes

    ) external {



        producers[msg.sender] = ProducerInfo({

            gst: gst,

            location: location,

            energyTypes: energyTypes,

            verified: true,

            totalMinted: 0

        });



        emit ProducerRegistered(msg.sender);

    }



    function getProducerInfo(address producer)

        external view returns (ProducerInfo memory)

    {

        return producers[producer];

    }



    // -----------------------------

    // Buyer

    // -----------------------------



    function registerBuyer() external {



        buyers[msg.sender] = BuyerInfo({

            registered: true,

            approved: false,

            totalBought: 0,

            totalRetired: 0

        });



        emit BuyerRegistered(msg.sender);

    }



    function approveBuyer(address buyer) external onlyOwner {

        buyers[buyer].approved = true;

        emit BuyerApproved(buyer);

    }



    // -----------------------------

    // Mint Tokens

    // -----------------------------



    function mintTokens(

        uint256 amount,

        string calldata energyType,

        bytes32 zkProofHash

    ) external {



        require(producers[msg.sender].verified, "Not producer");

        require(!zkProofUsed[zkProofHash], "Proof used");



        zkProofUsed[zkProofHash] = true;



        _mint(msg.sender, amount);



        _recBalances[msg.sender][energyType] += amount;



        producers[msg.sender].totalMinted += amount;



        _awardPoints(msg.sender, amount * GP_PER_MINT, "mint");



        emit RECMinted(msg.sender, amount, energyType);

    }



    // -----------------------------

    // Retirement

    // -----------------------------



    function retireTokens(

        uint256 amount,

        string calldata energyType

    ) external {



        require(_recBalances[msg.sender][energyType] >= amount);



        _recBalances[msg.sender][energyType] -= amount;



        _burn(msg.sender, amount);



        buyers[msg.sender].totalRetired += amount;



        _awardPoints(msg.sender, amount * GP_PER_RETIRE, "retire");



        emit RECRetired(msg.sender, amount, energyType);

    }



    // -----------------------------

    // Marketplace Listing

    // -----------------------------



    function listTokens(

        uint256 amount,

        uint256 pricePerToken,

        string calldata energyType,

        bytes32 zkProofHash

    ) external {



        require(_recBalances[msg.sender][energyType] >= amount);



        _recBalances[msg.sender][energyType] -= amount;



        listings[nextListingId] = Listing({

            id: nextListingId,

            seller: msg.sender,

            amount: amount,

            pricePerToken: pricePerToken,

            energyType: energyType,

            location: producers[msg.sender].location,

            zkProofHash: zkProofHash,

            active: true

        });



        emit ListingCreated(nextListingId, msg.sender, amount);



        nextListingId++;

    }



    function cancelListing(uint256 listingId) external {



        Listing storage listing = listings[listingId];



        require(listing.seller == msg.sender);

        require(listing.active);



        listing.active = false;



        _recBalances[msg.sender][listing.energyType] += listing.amount;



        emit ListingCancelled(listingId);

    }



    // -----------------------------

    // BUY TOKENS (Dummy Price)

    // -----------------------------



    function buyTokens(

        uint256 listingId,

        uint256 amount,

        bytes32 fileverseDocHash

    ) external {



        require(buyers[msg.sender].approved);



        Listing storage listing = listings[listingId];



        require(listing.active);

        require(listing.amount >= amount);



        uint256 totalCost = listing.pricePerToken * amount;



        require(dummyCredits[msg.sender] >= totalCost);



        dummyCredits[msg.sender] -= totalCost;

        dummyCredits[listing.seller] += totalCost;



        listing.amount -= amount;



        if(listing.amount == 0){

            listing.active = false;

        }



        _recBalances[msg.sender][listing.energyType] += amount;



        buyers[msg.sender].totalBought += amount;



        _awardPoints(listing.seller, amount * GP_PER_SALE, "sell");

        _awardPoints(msg.sender, amount * GP_PER_BUY, "buy");



        sellingHistory[listing.seller].push(TradeReceipt({

            counterparty: msg.sender,

            amount: amount,

            pricePerToken: listing.pricePerToken,

            energyType: listing.energyType,

            zkProofHash: listing.zkProofHash,

            fileverseDocHash: fileverseDocHash,

            timestamp: block.timestamp,

            retired: false

        }));



        buyingHistory[msg.sender].push(TradeReceipt({

            counterparty: listing.seller,

            amount: amount,

            pricePerToken: listing.pricePerToken,

            energyType: listing.energyType,

            zkProofHash: listing.zkProofHash,

            fileverseDocHash: fileverseDocHash,

            timestamp: block.timestamp,

            retired: false

        }));



        emit RECBought(msg.sender, listingId, amount);

    }



    // -----------------------------

    // Views

    // -----------------------------



    function getListing(uint256 listingId)

        external view returns (Listing memory)

    {

        return listings[listingId];

    }



    function getRECBalance(address account, string calldata energyType)

        external view returns (uint256)

    {

        return _recBalances[account][energyType];

    }



    function getBuyingHistory(address buyer)

        external view returns (TradeReceipt[] memory)

    {

        return buyingHistory[buyer];

    }



    function getSellingHistory(address seller)

        external view returns (TradeReceipt[] memory)

    {

        return sellingHistory[seller];

    }



    // -----------------------------

    // GreenPoints

    // -----------------------------



    function getGreenPoints(address user)

        external view returns(uint256)

    {

        return greenPoints[user];

    }



    function _awardPoints(address user, uint256 pts, string memory reason) internal {



        greenPoints[user] += pts;



        emit GreenPointsAwarded(user, pts, reason);



        _updateLeaderboard(user);

    }



    function _updateLeaderboard(address user) internal {



        bool exists;



        for(uint i=0;i<leaderboard.length;i++){

            if(leaderboard[i]==user){

                exists=true;

                break;

            }

        }



        if(!exists){

            if(leaderboard.length < LEADERBOARD_SIZE){

                leaderboard.push(user);

            }

        }

    }



}