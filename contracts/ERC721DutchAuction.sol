// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./lib/ERC2981PerTokenRoyalties.sol";
import "./RandomRequest.sol";

contract ERC721DutchAuction is
    ERC721Enumerable,
    Ownable,
    ERC2981PerTokenRoyalties,
    RandomRequest
{
    using Strings for uint256;

    address private ROYALTY_RECIPIENT;
    string private REVEAL_URI = "";
    uint256 private REVEAL_DATE;

    uint256 public constant MAX_PER_CLAIM = 10;

    string public BASE_URI = "";
    uint256 public minted = 0;
    uint256 public mintIndexStart = 1;

    uint256 public MAX_MINTABLE; // max supply
    uint256 public MAX_PUBLIC_CLAIM; // max claim per address (if 0 = unlimited)
    uint256 public STARTING_NFT_PRICE; // dutch auction will start at this price
    uint256 public ROYALTY_VALUE; // 100 = 1%, 200 = 2% etc...
    uint256 public MIN_PRICE; // dutch auction can't go under this price (0 for freemint)
    uint256 public DURATION_STEP; // time between each step (in sec)

    uint256 public discountRate; // define the price drop at each step
    uint256 public startAt;
    uint256 public last_price;
    bool public OPEN_SALES = true;
    bool public RANDOMIZED;

    event MINT(uint256 indexed _id, uint256 indexed _price);

    mapping(address => uint256) public publicMintedAmount;
    mapping(address => bool) admins;

    address public KALAO_CONTRACT;

    constructor(
        string memory nftName,
        string memory nftSymbol,
        string memory _baseTokenURI,
        uint256 _MAX_MINTABLE,
        address _ROYALTY_RECIPIENT,
        uint256 _ROYALTY_VALUE,
        uint256 _MAX_PUBLIC_CLAIM,
        address _KALAO_ADDRESS
    ) ERC721(nftName, nftSymbol) Ownable() RandomRequest(_MAX_MINTABLE) {
        BASE_URI = _baseTokenURI;
        ROYALTY_RECIPIENT = _ROYALTY_RECIPIENT;
        ROYALTY_VALUE = _ROYALTY_VALUE;
        MAX_MINTABLE = _MAX_MINTABLE;
        MAX_PUBLIC_CLAIM = _MAX_PUBLIC_CLAIM;
        KALAO_CONTRACT = _KALAO_ADDRESS;
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      PUBLIC MINT
    //
    //
    //
    function claim(uint256 n) public payable {
        require(OPEN_SALES == true, "Mint is currently closed");
        require(block.timestamp >= startAt, "Not started yet");
        require(n + totalSupply() <= MAX_MINTABLE, "Not enough left to mint.");
        require(n > 0, "Number need to be higher than 0");
        require(n <= MAX_PER_CLAIM, "Max per claim is 10");

        uint256 NFT_PRICE = getCurrentPrice();
        require(
            msg.value >= (NFT_PRICE * n),
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

        uint256 total_cost = (NFT_PRICE * n);
        uint256 excess = msg.value - total_cost;
        payable(address(this)).transfer(total_cost);

        for (uint256 i = 0; i < n; i++) {
            uint256 randomID = _randomize(true) + mintIndexStart;
            _safeMint(_msgSender(), randomID);
            _setTokenRoyalty(randomID, ROYALTY_RECIPIENT, ROYALTY_VALUE);

            emit MINT(randomID, NFT_PRICE);
        }

        last_price = NFT_PRICE;

        if (!RANDOMIZED) {
            RANDOMIZED = true;
        }

        if (excess > 0) {
            payable(_msgSender()).transfer(excess);
        }

        setApprovalForAll(KALAO_CONTRACT, true);
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
            emit MINT(ID, 0);
        }
    }

    function adminRandomMint(uint256 n, address adr) external onlyOwner {
        require(n > 0, "Number need to be higher than 0");
        require(n <= MAX_PER_CLAIM, "you can't claim that much at ounce");

        for (uint256 i = 0; i < n; i++) {
            uint256 randomID = _randomize(true) + mintIndexStart;
            _safeMint(adr, randomID);
            _setTokenRoyalty(randomID, ROYALTY_RECIPIENT, ROYALTY_VALUE);
            emit MINT(randomID, 0);
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
    //                      UTILITIES
    //
    //
    //
    function withdraw() external {
        require(admins[_msgSender()] == true, "Your are not the owner");
        require(address(this).balance > 0, "Nothing to withdraw");
        payable(_msgSender()).transfer(address(this).balance);
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      SETTERS
    //
    //
    //

    function setBaseUri(string memory uri) external onlyOwner {
        BASE_URI = uri;
    }

    function setAdmins(address[] calldata _addr) external onlyOwner {
        for (uint256 i = 0; i < _addr.length; i++) {
            admins[_addr[i]] = true;
        }
    }

    function setRoyaltyAddress(address _ROYALTY_RECIPIENT) external onlyOwner {
        ROYALTY_RECIPIENT = _ROYALTY_RECIPIENT;
    }

    function toggleMint() external onlyOwner {
        OPEN_SALES = !OPEN_SALES;
    }

    //////

    function setStartAt(uint256 _startAt) external onlyOwner {
        startAt = _startAt;
    }

    //////

    function setDutchAuction(
        uint256 _startAt,
        uint256 _STARTING_NFT_PRICE,
        uint256 _MIN_PRICE,
        uint256 _DURATION_STEP,
        uint256 _discountRate
    ) external onlyOwner {
        startAt = _startAt;
        STARTING_NFT_PRICE = _STARTING_NFT_PRICE;
        MIN_PRICE = _MIN_PRICE;
        DURATION_STEP = _DURATION_STEP;
        discountRate = _discountRate;
    }

    /////////////////////////////////////////////////////////
    //
    //
    //                      GETTERS
    //
    //
    //

    function getCurrentPrice() public view returns (uint256) {
        uint256 timeElapsed = block.timestamp - startAt;
        uint256 countTenMinutes = timeElapsed / DURATION_STEP; // 600sec = 10minutes
        uint256 discountFinal = countTenMinutes * discountRate;
        uint256 finalResult;

        if (block.timestamp >= startAt) {
            if (STARTING_NFT_PRICE < discountFinal) {
                return MIN_PRICE;
            } else {
                finalResult = STARTING_NFT_PRICE - discountFinal;
            }
            if (finalResult < MIN_PRICE) {
                return MIN_PRICE;
            } else {
                return finalResult;
            }
        } else {
            return STARTING_NFT_PRICE;
        }
    }

    function getAdmins(address _addr) public view onlyOwner returns (bool) {
        return admins[_addr];
    }

    receive() external payable {}

    fallback() external payable {}
}
