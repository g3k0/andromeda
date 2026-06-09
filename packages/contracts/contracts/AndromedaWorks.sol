// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AndromedaWorks
/// @notice Registry of author-certified literary works. Each purchased copy is
///         minted as an ERC-721 token that readers can own and collect.
contract AndromedaWorks is ERC721URIStorage, Ownable, ReentrancyGuard {
    struct Work {
        address author;
        string metadataURI;
        uint256 price; // price per copy, in wei
        uint256 maxCopies; // 0 means unlimited
        uint256 minted;
        bool active;
    }

    uint256 public totalWorks;
    uint256 private _nextTokenId = 1;

    mapping(uint256 => Work) public works;
    mapping(uint256 => uint256) public workOfToken;

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
        address indexed buyer
    );

    error WorkNotFound();
    error WorkInactive();
    error NotAuthor();
    error SoldOut();
    error InsufficientPayment();
    error PaymentFailed();

    constructor(address initialOwner)
        ERC721("Andromeda Works", "ANDR")
        Ownable(initialOwner)
    {}

    /// @notice Register a new work. The caller becomes its certified author.
    function registerWork(
        string calldata metadataURI,
        uint256 price,
        uint256 maxCopies
    ) external returns (uint256 workId) {
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
    }

    /// @notice Enable or disable sales of a work. Only the author can call.
    function setWorkActive(uint256 workId, bool active) external {
        Work storage work = _getWork(workId);
        if (msg.sender != work.author) revert NotAuthor();
        work.active = active;
        emit WorkStatusChanged(workId, active);
    }

    /// @notice Buy and mint a copy of a work. Payment is forwarded to the author.
    function mintCopy(uint256 workId)
        external
        payable
        nonReentrant
        returns (uint256 tokenId)
    {
        Work storage work = _getWork(workId);
        if (!work.active) revert WorkInactive();
        if (work.maxCopies != 0 && work.minted >= work.maxCopies) {
            revert SoldOut();
        }
        if (msg.value < work.price) revert InsufficientPayment();

        work.minted += 1;
        tokenId = _nextTokenId++;
        workOfToken[tokenId] = workId;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, work.metadataURI);

        if (work.price > 0) {
            (bool ok, ) = payable(work.author).call{value: work.price}("");
            if (!ok) revert PaymentFailed();
        }

        // Refund any overpayment.
        uint256 excess = msg.value - work.price;
        if (excess > 0) {
            (bool refunded, ) = payable(msg.sender).call{value: excess}("");
            if (!refunded) revert PaymentFailed();
        }

        emit CopyMinted(workId, tokenId, msg.sender);
    }

    function _getWork(uint256 workId) private view returns (Work storage) {
        if (workId == 0 || workId > totalWorks) revert WorkNotFound();
        return works[workId];
    }
}
