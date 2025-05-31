// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ByteHasher } from "./helpers/ByteHasher.sol";
import { IWorldID } from "./interfaces/IWorldID.sol";

contract ProductReviewCommitments {
    struct ReviewCommitment {
        string barcode;
        address reviewer;
        uint8 rating;
        bytes32 contentHash; // Hash of the (review_text + other metadata)
        uint256 timestamp;
        bytes signature;     // Signature of the (review_text + other metadata) by the reviewer
        uint256 worldIdNullifierHash;
    }

    mapping(string => ReviewCommitment[]) public reviewCommitmentsByBarcode;
    mapping(bytes32 => bool) public isNullifierUsedForBarcodeReview; // keccak256(barcode, worldIdNullifierHash) => bool

    event ReviewCommitmentSubmitted(
        string indexed barcode,
        address indexed reviewer,
        uint8 rating,
        bytes32 contentHash,
        uint256 worldIdNullifierHash
    );

    IWorldID internal immutable worldId;
    uint256 internal immutable groupId = 1;

    constructor(IWorldID _worldId) {
        worldId = _worldId;
    }

    // Called by your trusted backend
    function submitReviewCommitment(
        string memory _barcode,
        address _reviewer,
        uint8 _rating,
        bytes32 _contentHash,
        bytes memory _signature,
        uint256 _worldIdNullifierHash,
        uint256 root,
        uint256[8] calldata proof,
        string memory _appId,
        string memory _actionId
    ) public {
        // Compute externalNullifier on the fly
        uint256 externalNullifier = ByteHasher.hashToField(abi.encodePacked(ByteHasher.hashToField(abi.encodePacked(_appId)), _actionId));

        // Check if the review commitment has already been submitted
        if (isNullifierUsedForBarcodeReview[keccak256(abi.encodePacked(_barcode, _worldIdNullifierHash))]) {
            revert("Review commitment already submitted.");
        }

        // World ID verification
        worldId.verifyProof(
            root,
            groupId,
            ByteHasher.hashToField(abi.encodePacked(_reviewer)),
            _worldIdNullifierHash,
            externalNullifier,
            proof
        );

        // Add the review commitment to the mapping
        reviewCommitmentsByBarcode[_barcode].push(ReviewCommitment({
            barcode: _barcode,
            reviewer: _reviewer,
            rating: _rating,
            contentHash: _contentHash,
            timestamp: block.timestamp, // On-chain timestamp
            signature: _signature,
            worldIdNullifierHash: _worldIdNullifierHash
        }));

        // Mark the nullifier as used
        isNullifierUsedForBarcodeReview[keccak256(abi.encodePacked(_barcode, _worldIdNullifierHash))] = true;

        // Emit the event
        emit ReviewCommitmentSubmitted(_barcode, _reviewer, _rating, _contentHash, _worldIdNullifierHash);
    }

    function getReviewCommitments(string memory _barcode) public view returns (ReviewCommitment[] memory) {
        return reviewCommitmentsByBarcode[_barcode];
    }
}