// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AndromedaWorks
/// @notice Registry of author-certified literary works. On publish the author receives
///         the full numbered edition; primary sales transfer copies from that inventory.
contract AndromedaWorks is ERC721URIStorage, Ownable, ReentrancyGuard {
    struct Work {
        address author;
        string metadataURI;
        uint256 price; // price per copy, in wei
        uint256 maxCopies; // must be > 0 at registration
        uint256 minted;
        bool active;
    }

    uint256 public totalWorks;
    uint256 private _nextTokenId = 1;

    mapping(uint256 => Work) public works;
    mapping(uint256 => uint256) public workOfToken;
    mapping(uint256 => uint256) public copyNumberOfToken;
    mapping(uint256 => uint256[]) private _primarySaleInventory;
    mapping(uint256 => string) private _envelopeURIOfToken;

    event WorkRegistered(
        uint256 indexed workId,
        address indexed author,
        string metadataURI,
        uint256 price,
        uint256 maxCopies
    );
    event WorkStatusChanged(uint256 indexed workId, bool active);
    event CopyMinted(
        uint256 indexed workId,
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 copyNumber
    );
    event CopyPurchased(
        uint256 indexed workId,
        uint256 indexed tokenId,
        address indexed buyer
    );
    event CopyMetadataUpdated(uint256 indexed tokenId, string metadataURI);
    event CopyEnvelopeUpdated(uint256 indexed tokenId, string envelopeURI);
    event WorkMetadataUpdated(uint256 indexed workId, string metadataURI);

    error WorkNotFound();
    error WorkInactive();
    error NotAuthor();
    error NotCopyOwner();
    error NotAuthorized();
    error SoldOut();
    error InsufficientPayment();
    error PaymentFailed();
    error InvalidMaxCopies();
    error NoCopiesAvailable();

    constructor(address initialOwner)
        ERC721("Andromeda Works", "ANDR")
        Ownable(initialOwner)
    {}

    /// @notice Register a work and mint the full edition to the author.
    function registerWork(
        string calldata metadataURI,
        uint256 price,
        uint256 maxCopies
    ) external returns (uint256 workId) {
        if (maxCopies == 0) revert InvalidMaxCopies();

        workId = ++totalWorks;
        works[workId] = Work({
            author: msg.sender,
            metadataURI: metadataURI,
            price: price,
            maxCopies: maxCopies,
            minted: 0,
            active: true
        });
        emit WorkRegistered(workId, msg.sender, metadataURI, price, maxCopies);

        for (uint256 i = 0; i < maxCopies; i++) {
            _mintCopyToAuthor(workId, msg.sender, metadataURI, i + 1);
            works[workId].minted += 1;
        }
    }

    /// @notice Copies still held by the author and available for primary sale.
    function primarySaleRemaining(uint256 workId) external view returns (uint256) {
        _getWork(workId);
        return _primarySaleInventory[workId].length;
    }

    /// @notice Enable or disable primary sales. Only the author can call.
    function setWorkActive(uint256 workId, bool active) external {
        Work storage work = _getWork(workId);
        if (msg.sender != work.author) revert NotAuthor();
        work.active = active;
        emit WorkStatusChanged(workId, active);
    }

    /// @notice Repoint work-level ACE metadata URI (e.g. legacy IPFS → Arweave).
    /// @dev Author-only so certified works can migrate without reminting.
    function updateWorkMetadataURI(uint256 workId, string calldata metadataURI)
        external
    {
        Work storage work = _getWork(workId);
        if (msg.sender != work.author) revert NotAuthor();
        work.metadataURI = metadataURI;
        emit WorkMetadataUpdated(workId, metadataURI);
    }

    /// @notice Buy a copy from the author's primary-sale inventory.
    function mintCopy(uint256 workId)
        external
        payable
        nonReentrant
        returns (uint256 tokenId)
    {
        Work storage work = _getWork(workId);
        if (!work.active) revert WorkInactive();

        uint256[] storage inventory = _primarySaleInventory[workId];
        if (inventory.length == 0) revert SoldOut();
        if (msg.value < work.price) revert InsufficientPayment();

        tokenId = inventory[inventory.length - 1];
        inventory.pop();

        if (ownerOf(tokenId) != work.author) revert NoCopiesAvailable();

        _transfer(work.author, msg.sender, tokenId);

        if (work.price > 0) {
            (bool ok, ) = payable(work.author).call{value: work.price}("");
            if (!ok) revert PaymentFailed();
        }

        uint256 excess = msg.value - work.price;
        if (excess > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: excess}("");
            if (!refunded) revert PaymentFailed();
        }

        emit CopyPurchased(workId, tokenId, msg.sender);
    }

    /// @notice Attach per-token metadata to a minted copy (numbered edition).
    function setCopyMetadataURI(uint256 tokenId, string calldata metadataURI)
        external
    {
        address tokenOwner = _requireOwned(tokenId);
        if (msg.sender != tokenOwner) revert NotCopyOwner();
        _setTokenURI(tokenId, metadataURI);
        emit CopyMetadataUpdated(tokenId, metadataURI);
    }

    /// @notice ACE envelope content URI for a minted copy (`ar://…` or legacy `ipfs://…`).
    function envelopeURIOfToken(uint256 tokenId) external view returns (string memory) {
        _requireOwned(tokenId);
        return _envelopeURIOfToken[tokenId];
    }

    /// @notice Attach the ACE envelope URI. Callable by the copy owner or the work author.
    function setCopyEnvelopeURI(uint256 tokenId, string calldata envelopeURI)
        external
    {
        address tokenOwner = _requireOwned(tokenId);
        uint256 workId = workOfToken[tokenId];
        address author = works[workId].author;
        if (msg.sender != tokenOwner && msg.sender != author) {
            revert NotAuthorized();
        }
        _envelopeURIOfToken[tokenId] = envelopeURI;
        emit CopyEnvelopeUpdated(tokenId, envelopeURI);
    }

    function _mintCopyToAuthor(
        uint256 workId,
        address author,
        string memory metadataURI,
        uint256 copyNumber
    ) private returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        workOfToken[tokenId] = workId;
        copyNumberOfToken[tokenId] = copyNumber;
        _primarySaleInventory[workId].push(tokenId);
        _safeMint(author, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit CopyMinted(workId, tokenId, author, copyNumber);
    }

    function _getWork(uint256 workId) private view returns (Work storage) {
        if (workId == 0 || workId > totalWorks) revert WorkNotFound();
        return works[workId];
    }
}
