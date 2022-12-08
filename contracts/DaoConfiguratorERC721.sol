// SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./lib/ERC2981PerTokenRoyalties.sol";
import "./RandomRequest.sol";

contract DaoConfiguratorERC721 is
    ERC721Enumerable,
    Ownable,
    ERC2981PerTokenRoyalties,
    RandomRequest
{
    using Strings for uint256;

    string public BASE_URI = "";
    string private REVEAL_URI = "";
    bool public OPEN_SALES = true;
    bool public HAS_WL = false;
    bool public RANDOMIZED = false;

    uint256 public constant MAX_PER_CLAIM = 10;
    uint256 public MAX_MINTABLE; // max supply
    uint256 public mintIndexStart = 1;
    uint256 private REVEAL_DATE;

    address private ROYALTY_RECIPIENT;
    uint256 public ROYALTY_VALUE; // 100 = 1%, 200 = 2% etc...

    uint256 public MAX_PUBLIC_CLAIM; // max mint per address for the public / if 0, their is no limit
    uint256 public PUBLIC_START_DATE;
    uint256 public PUBLIC_NFT_PRICE; // price for public

    uint256 public MAX_WL_CLAIM; // max mint per address for the WL / if 0, their is no limit
    uint256 public WL_START_DATE;
    uint256 public WL_NFT_PRICE; // price for WL

    bytes32 public MERKLE_ROOT;

    mapping(address => uint256) public whiteListMintAddresses;
    mapping(address => uint256) public publicMintedAmount;
    mapping(address => bool) private admins;

    event WL_MINT(uint256 indexed _id);
    event MINT(uint256 indexed _id);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI,
        string memory _revealURI,
        uint256 _MAX_MINTABLE,
        address _ROYALTY_RECIPIENT,
        uint256 _ROYALTY_VALUE,
        uint256 _START_DATE,
        uint256 _NFT_PUBLIC_PRICE,
        uint256 _REVEAL_DATE,
        uint256 _MAX_PUBLIC_CLAIM
    ) ERC721(_name, _symbol) Ownable() RandomRequest(_MAX_MINTABLE) {
        MAX_MINTABLE = _MAX_MINTABLE;
        BASE_URI = _baseTokenURI;
        REVEAL_URI = _revealURI;
        REVEAL_DATE = _REVEAL_DATE;
        ROYALTY_RECIPIENT = _ROYALTY_RECIPIENT;
        ROYALTY_VALUE = _ROYALTY_VALUE;
        PUBLIC_START_DATE = _START_DATE;
        PUBLIC_NFT_PRICE = _NFT_PUBLIC_PRICE;
        MAX_PUBLIC_CLAIM = _MAX_PUBLIC_CLAIM;
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      EARLY MINT
    //
    //
    //
    function whiteListMint(uint256 n, bytes32[] calldata _proof)
        public
        payable
    {
        // check if event has a WL
        require(HAS_WL, "No whitelist assigned to this project");

        // check if mint event is open or closed
        require(OPEN_SALES, "It's not possible to claim just yet");

        // check WL mint date
        require(block.timestamp >= WL_START_DATE, "Not started yet");

        // check public mint date
        require(
            block.timestamp < PUBLIC_START_DATE,
            "Public mint is open, the whitelist mint is over"
        );

        // cannot mint 0 erc721
        require(n > 0, "Number need to be higher than 0");
        // check if the supply is still enough
        require(n + totalSupply() <= MAX_MINTABLE, "Not enough left to mint");
        // check the mint amount (should not exceed MAX_PER_CLAIM)
        require(n <= MAX_PER_CLAIM, "you can't claim that much at ounce");

        // create the leaf with sender address
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        // check if leaf exists in merkle tree (checks if sender is whitelisted)
        require(
            MerkleProof.verify(_proof, MERKLE_ROOT, leaf),
            "Invalid Merkle Proof"
        );

        // check if the value sent is correct
        require(
            msg.value >= (WL_NFT_PRICE * n),
            "Ether value sent is below the price"
        );

        // if MAX_WL_CLAIM > 0, we check if the sender has exceeded mint limit
        if (MAX_WL_CLAIM > 0) {
            require(
                whiteListMintAddresses[msg.sender] <= MAX_WL_CLAIM,
                "You can't claim anymore"
            );
            require(
                n + whiteListMintAddresses[msg.sender] <= MAX_WL_CLAIM,
                "you can't claim that much"
            );

            // After the checks, we increments sender mint count
            whiteListMintAddresses[msg.sender] += n;
        }

        //  check if the tokens sent exceeds the price, in order to return the rest
        uint256 total_cost = (WL_NFT_PRICE * n);
        uint256 excess = msg.value - total_cost;
        payable(address(this)).transfer(total_cost);

        for (uint256 i = 0; i < n; i++) {
            // get random tokenID
            uint256 randomID = _randomize(true) + mintIndexStart;
            // mint random token
            _safeMint(_msgSender(), randomID);
            // set royalty value and recipient for this tokenID
            _setTokenRoyalty(randomID, ROYALTY_RECIPIENT, ROYALTY_VALUE);

            emit WL_MINT(randomID);
        }

        // mark that the tokens has been randomized in order to call adminMintRandom
        if (!RANDOMIZED) {
            RANDOMIZED = true;
        }

        if (excess > 0) {
            // return the rest of tokens to sender
            payable(_msgSender()).transfer(excess);
        }
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      PUBLIC MINT
    //
    //
    //
    function publicMint(uint256 n) public payable {
        require(OPEN_SALES, "It's not possible to claim just yet");
        require(block.timestamp >= PUBLIC_START_DATE, "Not started yet");
        require(n > 0, "Number need to be higher than 0");
        require(n + totalSupply() <= MAX_MINTABLE, "Not enough left to mint");
        require(n <= MAX_PER_CLAIM, "you can't claim that much at once");
        require(
            msg.value >= (PUBLIC_NFT_PRICE * n),
            "Ether value sent is below the price"
        );
        if (MAX_PUBLIC_CLAIM > 0) {
            require(
                publicMintedAmount[msg.sender] < MAX_PUBLIC_CLAIM,
                "amount exceeds the public minting limit"
            );
            require(
                n + publicMintedAmount[msg.sender] <= MAX_PUBLIC_CLAIM,
                "you can't claim that much"
            );
            publicMintedAmount[msg.sender] += n;
        }

        uint256 total_cost = (PUBLIC_NFT_PRICE * n);

        uint256 excess = msg.value - total_cost;
        payable(address(this)).transfer(total_cost);

        for (uint256 i = 0; i < n; i++) {
            uint256 randomID = _randomize(true) + mintIndexStart;
            _safeMint(_msgSender(), randomID);
            _setTokenRoyalty(randomID, ROYALTY_RECIPIENT, ROYALTY_VALUE);

            emit MINT(randomID);
        }

        // mark that the tokens has been randomized in order to call adminMintRandom
        if (!RANDOMIZED) {
            RANDOMIZED = true;
        }

        if (excess > 0) {
            payable(_msgSender()).transfer(excess);
        }
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      Transfers
    //
    //
    //

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        _safeTransfer(from, to, tokenId, _data);
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      ADMIN MINT
    //
    //
    //

    function adminMint(uint256 n, address adr) external onlyOwner {
        require(n > 0, "Number need to be higher than 0");
        require(n <= MAX_PER_CLAIM, "you can't claim that much at ounce");
        require(
            !RANDOMIZED,
            "can't mint in order, tokens have already been randomized"
        );

        for (uint256 i = 0; i < n; i++) {
            uint256 ID = _randomize(false) + mintIndexStart;
            _safeMint(adr, ID);
            _setTokenRoyalty(ID, ROYALTY_RECIPIENT, ROYALTY_VALUE);
            emit MINT(ID);
        }
    }

    function adminRandomMint(uint256 n, address adr) external onlyOwner {
        require(n > 0, "Number need to be higher than 0");
        require(n <= MAX_PER_CLAIM, "you can't claim that much at ounce");

        for (uint256 i = 0; i < n; i++) {
            uint256 randomID = _randomize(true) + mintIndexStart;
            _safeMint(adr, randomID);
            _setTokenRoyalty(randomID, ROYALTY_RECIPIENT, ROYALTY_VALUE);
            emit MINT(randomID);
        }

        // mark that the tokens has been randomized in order to call adminMintRandom
        if (!RANDOMIZED) {
            RANDOMIZED = true;
        }
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                       ERC
    //
    //
    //
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();

        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json"))
                : "";
    }

    function _baseURI() internal view override returns (string memory) {
        if (block.timestamp >= REVEAL_DATE) {
            return REVEAL_URI;
        } else {
            return BASE_URI;
        }
    }

    /// @inheritdoc	ERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC2981Base, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      SETTERS
    //
    //
    //

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        MERKLE_ROOT = _root;
    }

    function setPublicStartDate(uint256 _START_DATE) external onlyOwner {
        PUBLIC_START_DATE = _START_DATE;
    }

    function setWLstartDate(uint256 _WL_START_DATE) external onlyOwner {
        WL_START_DATE = _WL_START_DATE;
    }

    function setRevealDate(uint256 _REVEAL_DATE) external onlyOwner {
        REVEAL_DATE = _REVEAL_DATE;
    }

    function setRoyaltyAddress(address _ROYALTY_RECIPIENT) external onlyOwner {
        ROYALTY_RECIPIENT = _ROYALTY_RECIPIENT;
    }

    function setBaseUri(string memory uri) external onlyOwner {
        BASE_URI = uri;
    }

    function setRevealUri(string memory uri) external onlyOwner {
        REVEAL_URI = uri;
    }

    function toggleMint() external onlyOwner {
        OPEN_SALES = !OPEN_SALES;
    }

    function setAdmins(address[] calldata _addr) external onlyOwner {
        for (uint256 i = 0; i < _addr.length; i++) {
            admins[_addr[i]] = true;
        }
    }

    function setWhiteList(
        uint256 _WL_START_DATE,
        uint256 _MAX_WL_CLAIM,
        uint256 _WL_NFT_PRICE,
        bytes32 _MERKLE_ROOT,
        bool _HAS_WL
    ) external onlyOwner {
        WL_START_DATE = _WL_START_DATE;
        MAX_WL_CLAIM = _MAX_WL_CLAIM;
        WL_NFT_PRICE = _WL_NFT_PRICE;
        MERKLE_ROOT = _MERKLE_ROOT;
        HAS_WL = _HAS_WL;
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      GETTERS
    //
    //
    //

    function isWhiteListed(
        address _whitelistedAddress,
        bytes32[] calldata _proof
    ) public view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_whitelistedAddress));
        return MerkleProof.verify(_proof, MERKLE_ROOT, leaf);
    }

    function whiteListMintedCount(address _whitelistedAddress)
        public
        view
        returns (uint256)
    {
        uint256 userMinted = whiteListMintAddresses[_whitelistedAddress];
        return userMinted;
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      UTILITIES
    //
    //
    //

    function withdraw() external {
        require(admins[_msgSender()] == true, "Your are not the owner");
        require(address(this).balance > 0, "Nothing to withdraw");
        payable(_msgSender()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
