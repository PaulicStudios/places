// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IWorldID {
	/// @notice Reverts if the zero-knowledge proof is invalid.
	/// @param root The of the Merkle tree
	/// @param groupId The id of the Semaphore group
	/// @param signalHash A keccak256 hash of the Semaphore signal
	/// @param nullifierHash The nullifier hash
	/// @param externalNullifierHash A keccak256 hash of the external nullifier
	/// @param proof The zero-knowledge proof
	/// @dev  Note that a double-signaling check is not included here, and should be carried by the caller.
	function verifyProof(
		uint256 root,
		uint256 groupId,
		uint256 signalHash,
		uint256 nullifierHash,
		uint256 externalNullifierHash,
		uint256[8] calldata proof
	) external view;
}

library ByteHasher {
	/// @dev Creates a keccak256 hash of a bytestring.
	/// @param value The bytestring to hash
	/// @return The hash of the specified value
	/// @dev `>> 8` makes sure that the result is included in our field
	function hashToField(bytes memory value) internal pure returns (uint256) {
		return uint256(keccak256(abi.encodePacked(value))) >> 8;
	}
}

contract ProductReviewCommitments {
    using ByteHasher for bytes;

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

	uint256 internal immutable externalNullifier;

    constructor(IWorldID _worldId, string memory _appId, string memory _actionId) {
        worldId = _worldId;
        externalNullifier = abi.encodePacked(abi.encodePacked(_appId).hashToField(), _actionId).hashToField();
    }

    // Called by your trusted backend
    function submitReviewCommitment(
        string memory _barcode,
        address _reviewer,
        uint8 _rating,
        bytes32 _contentHash,
        bytes memory _signature,
        uint256 worldIdNullifierHash,
        uint256 root,
        uint256[8] calldata proof
    ) public {
        // Check if the review commitment has already been submitted
        if (isNullifierUsedForBarcodeReview[keccak256(abi.encodePacked(_barcode, worldIdNullifierHash))]) {
            revert("Review commitment already submitted.");
        }

        // World ID verification
        worldId.verifyProof(
            root,
            groupId,
            abi.encodePacked("COREGAME").hashToField(),
            worldIdNullifierHash,
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
            worldIdNullifierHash: worldIdNullifierHash
        }));

        // Mark the nullifier as used
        isNullifierUsedForBarcodeReview[keccak256(abi.encodePacked(_barcode, worldIdNullifierHash))] = true;

        // Emit the event
        emit ReviewCommitmentSubmitted(_barcode, _reviewer, _rating, _contentHash, worldIdNullifierHash);
    }

    function getReviewCommitments(string memory _barcode) public view returns (ReviewCommitment[] memory) {
        return reviewCommitmentsByBarcode[_barcode];
    }
}