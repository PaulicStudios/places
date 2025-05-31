// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Script.sol";
import "../src/ProductReviewCommitments.sol";
import "../src/interfaces/IWorldID.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // World ID contract address
        address worldIdAddress = 0x17B354dD2595411ff79041f930e491A4Df39A278;
        
        IWorldID worldId = IWorldID(worldIdAddress);
        ProductReviewCommitments productReview = new ProductReviewCommitments(worldId, "app_e7ffd3a5eb7e7210ce59a79666b17a7b", "verify-review");

        vm.stopBroadcast();
    }
}
