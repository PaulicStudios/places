// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Script.sol";
import { ProductReviewCommitments, IWorldID } from "../src/ProductReviewCommitments.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // World ID contract address
        address worldIdAddress = vm.envAddress("WORLD_ID_ADDRESS");
        
        IWorldID worldId = IWorldID(worldIdAddress);
        ProductReviewCommitments productReview = new ProductReviewCommitments(
            worldId,
            vm.envString("APP_ID"),
            vm.envString("ACTION_ID")
        );

        vm.stopBroadcast();
    }
}
