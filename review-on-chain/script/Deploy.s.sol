// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Script.sol";
import { ProductReviewCommitments, IWorldID } from "../src/ProductReviewCommitments.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // World ID contract address
        address worldIdAddress = 0x17B354dD2595411ff79041f930e491A4Df39A278;
        
        IWorldID worldId = IWorldID(worldIdAddress);
        ProductReviewCommitments productReview = new ProductReviewCommitments(worldId, "app_23fd4240c950374e1cd8460e2593bd08", "verify-review");

        vm.stopBroadcast();
    }
}
