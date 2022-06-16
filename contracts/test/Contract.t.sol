// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;

import "forge-std/Test.sol";
import "../src/SonOfASwap.sol";

contract ContractTest is Test {
    SonOfASwap swapContract;

    function setUp() public {
        swapContract = new SonOfASwap();
    }

    function testInit() public {
        // TODO: this can be deleted
        assertTrue(swapContract.status() == 0);
    }

    function itVerifiesSignature() public {
        SwapOrder order = SwapOrder(
            router,
            amountIn,
            amountOut,
            tradeType,
            recipient,
            path,
            deadline,
            sqrtPriceLimitX96,
            fee,
            nonce
        );
        swapContract.verify(order, v, r, s);
    }

    // function itIncrementsNonceAfterSwap() public {
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function itExecutesExactInputSingle() public {
    //     // this one's easy
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function itExecutesExactOutputSingle() public {
    //     // TODO: how to use cheatcodes to set uniswap contract state for repeatable test execution?
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function itExecutesExactInput() public {
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function itExecutesExactOutput() public {
    //     swapContract.verifyAndSend(order, v, r, s);
    // }
}
