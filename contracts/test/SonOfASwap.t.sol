// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.6;
pragma abicoder v2;

import "forge-std/Test.sol";
import "src/SonOfASwap.sol";

// import "@uniswap/swap-router-contracts/contracts/interfaces/ISwapRouter02.sol";
// import "@openzeppelin/contracts/contracts/token/ERC20/IERC20.sol";

contract ContractTest is Test {
    SonOfASwap swapContract;

    function setUp() public {
        address deploymentAddress = deployCode("SonOfASwap.sol:SonOfASwap");
        swapContract = SonOfASwap(payable(deploymentAddress));
        emit log("Contract Deployed");
        emit log_address(deploymentAddress);
    }

    function getSwapOrderExactInputSingle()
        public
        pure
        returns (
            SwapOrder memory order,
            uint8 v,
            bytes32 r,
            bytes32 s
        )
    {
        address token1 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
        address token2 = 0x7ebC3778cF08f636805D9382D6c16e79ed9F370E;
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token2;
        order = SwapOrder(
            0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45,
            1000000000000000,
            42,
            "v3_exactInputSingle",
            0x8078d4D2BA0aA18a2Bf9e99002fA871cE8506984, // recipient
            path,
            1655425026, // deadline
            0, // sqrtX96
            3000, // fee
            0 // nonce
        );
        v = 27;
        r = 0xbf9bbd68ce707886da348a8e4ccb633cf30bba6b224169d125b0fbeeec8ebd4a;
        s = 0x33b93ed26d9a0174561e51748103d473dd5651a4bd067ed17f5900967072edb1;
        return (order, v, r, s);
    }

    function getSwapOrderExactInputSingleBadNonce()
        public
        pure
        returns (
            SwapOrder memory order,
            uint8 v,
            bytes32 r,
            bytes32 s
        )
    {
        address token1 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
        address token2 = 0x7ebC3778cF08f636805D9382D6c16e79ed9F370E;
        address[] memory path = new address[](2);
        path[0] = token1;
        path[1] = token2;
        order = SwapOrder(
            0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45,
            1000000000000000,
            42,
            "v3_exactInputSingle",
            0x8078d4D2BA0aA18a2Bf9e99002fA871cE8506984, // recipient
            path,
            1655425026, // deadline
            0, // sqrtX96
            3000, // fee
            13 // nonce
        );
        v = 28;
        r = 0xb492cb9ebc7da53b11ef9c530318ca4d11695a5e0e60562a1b8679c4202f302d;
        s = 0x20912c3219c412149259bc2781e653b3497bec91c757c2312864e9768804279c;
        return (order, v, r, s);
    }

    function testVerifiesSignature() public {
        // can't call `verify` directly bc it's not public, so
        // instead, just expect a revert and ensure the reason is not INVALID_SIGNATURE
        (
            SwapOrder memory order,
            uint8 v,
            bytes32 r,
            bytes32 s
        ) = getSwapOrderExactInputSingleBadNonce();

        // use an invalid nonce to trigger the nonce validation revert
        // INVALID_NONCE means that we passed the signature verification step
        vm.expectRevert(bytes("INVALID_NONCE"));
        swapContract.verifyAndSend(order, v, r, s);
    }

    function testRejectsInvalidSignature() public {
        // can't call `verify` directly bc it's not public, so
        // instead, just expect a revert and ensure the reason is INVALID_SIGNATURE
        (SwapOrder memory order, , , ) = getSwapOrderExactInputSingle();
        uint8 v_bad = 21;
        bytes32 r_bad = 0x006081903d4c18bcaae00fcfef1c00003eda62af55204cc4009ce298c82ffb00;
        bytes32 s_bad = 0x00a785c78114123f5bc00438daf30000095e9f42b391dc7900899e8a925b0800;

        vm.expectRevert(bytes("INVALID_SIGNATURE"));
        swapContract.verifyAndSend(order, v_bad, r_bad, s_bad);
    }

    // TODO: add uniswap contract deployments to setUp() before proceeding with the following:

    // function testIncrementsNonceAfterSwap() public {
    //     (
    //         SwapOrder memory order,
    //         uint8 v,
    //         bytes32 r,
    //         bytes32 s
    //     ) = getSwapOrderExactInputSingle();
    //     uint256 nonceStart = swapContract.nonces(order.recipient);
    //     swapContract.verifyAndSend(order, v, r, s);
    //     assertEq(swapContract.nonces(order.recipient), nonceStart + 1);
    // }

    // function testExecutesExactInputSingle() public {
    //     // this one's easy
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function testExecutesExactOutputSingle() public {
    //     // TODO: how to use cheatcodes to set uniswap contract state for repeatable test execution?
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function testExecutesExactInput() public {
    //     swapContract.verifyAndSend(order, v, r, s);
    // }

    // function testExecutesExactOutput() public {
    //     swapContract.verifyAndSend(order, v, r, s);
    // }
}
