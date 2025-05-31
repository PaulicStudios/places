// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import { ProductReviewCommitments } from "../src/ProductReviewCommitments.sol";
import { IWorldID } from "../src/interfaces/IWorldID.sol";

contract MockWorldID is IWorldID {
    function verifyProof(
        uint256, uint256, uint256, uint256, uint256, uint256[8] calldata
    ) external pure override {}
}

contract ProductReviewCommitmentsTest is Test {
    ProductReviewCommitments public reviewContract;
    MockWorldID public mockWorldID;

    string public constant BARCODE = "123456789";
    address public constant REVIEWER = address(0xBEEF);
    uint8 public constant RATING = 5;
    bytes32 public constant CONTENT_HASH = keccak256("review");
    bytes public constant SIGNATURE = hex"1234";
    uint256 public constant NULLIFIER_HASH = 42;
    uint256 public constant ROOT = 1;
    uint256[8] public PROOF = [uint256(0),0,0,0,0,0,0,0];
    string public constant APP_ID = "test-app";
    string public constant ACTION_ID = "test-action";

    function setUp() public {
        mockWorldID = new MockWorldID();
        reviewContract = new ProductReviewCommitments(mockWorldID, APP_ID, ACTION_ID);
    }

    function testSubmitReviewCommitment() public {
        reviewContract.submitReviewCommitment(
            BARCODE,
            REVIEWER,
            RATING,
            CONTENT_HASH,
            SIGNATURE,
            NULLIFIER_HASH,
            ROOT,
            PROOF
        );
        ProductReviewCommitments.ReviewCommitment[] memory reviews = reviewContract.getReviewCommitments(BARCODE);
        assertEq(reviews.length, 1);
        assertEq(reviews[0].reviewer, REVIEWER);
        assertEq(reviews[0].rating, RATING);
    }

    function testDuplicateReviewCommitmentReverts() public {
        reviewContract.submitReviewCommitment(
            BARCODE,
            REVIEWER,
            RATING,
            CONTENT_HASH,
            SIGNATURE,
            NULLIFIER_HASH,
            ROOT,
            PROOF
        );
        vm.expectRevert("Review commitment already submitted.");
        reviewContract.submitReviewCommitment(
            BARCODE,
            REVIEWER,
            RATING,
            CONTENT_HASH,
            SIGNATURE,
            NULLIFIER_HASH,
            ROOT,
            PROOF
        );
    }
} 