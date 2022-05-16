// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

struct SwapOrder {
    address router;
    uint256 amountIn;
    uint256 amountOut;
    string tradeType; // enum? // "v3_exactInputSingle" | "v3_exactOutputSingle" | "v3_exactInput" | "v3_exactOutput" | "v2_{methodName (there are quite a few)}"
    address recipient;
    address[] path;
    uint256 deadline;
    // v3
    uint160 sqrtPriceLimitX96;
    uint24 fee;
}

contract SonOfASwap {
    uint256 public status;
    address private owner;

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    string private constant SWAPORDER =
        "SwapOrder(address router,uint256 amountIn,uint256 amountOut,string tradeType,address recipient,address[] path,uint deadline,uint160 sqrtPriceLimitX96,uint24 fee)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant SWAPORDER_TYPEHASH =
        keccak256(abi.encodePacked(SWAPORDER));

    bytes32 private DOMAIN_SEPARATOR;

    function getChainID() internal view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    constructor() {
        owner = msg.sender;
        status = 0;
        DOMAIN_SEPARATOR = hash(
            EIP712Domain({
                name: "SonOfASwap",
                version: "1",
                chainId: getChainID(),
                verifyingContract: address(this)
            })
        );
    }

    receive() external payable {}

    function hash(EIP712Domain memory eip712Domain)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    EIP712_DOMAIN_TYPEHASH,
                    keccak256(bytes(eip712Domain.name)),
                    keccak256(bytes(eip712Domain.version)),
                    eip712Domain.chainId,
                    eip712Domain.verifyingContract
                )
            );
    }

    function hash(SwapOrder memory order) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    SWAPORDER_TYPEHASH,
                    order.router,
                    order.amountIn,
                    order.amountOut,
                    keccak256(bytes(order.tradeType)),
                    order.recipient,
                    keccak256(abi.encodePacked(order.path)),
                    order.deadline,
                    order.sqrtPriceLimitX96,
                    order.fee
                )
            );
    }

    function verify(
        SwapOrder memory order,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hash(order))
        );
        address recovered = ecrecover(digest, v, r, s);
        return recovered == order.recipient;
    }

    function stringsEqual(string memory a, string memory b)
        internal
        pure
        returns (bool)
    {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    event ExactInputSingleSwap(address indexed recipient);

    function sendOrder(SwapOrder memory order) internal {
        // instantiate router interface
        ISwapRouter router = ISwapRouter(order.router);
        // instantiate input token interface
        IERC20 tokenIn = IERC20(order.path[0]);

        // transfer input token from user to (this)
        tokenIn.transferFrom(order.recipient, address(this), order.amountIn);

        // choose router method based on order type
        // if (stringsEqual(order.tradeType, "v3_exactInputSingle")) {
        //     // encode function params based on order
        //     ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
        //         .ExactInputSingleParams(
        //             order.path[0], // tokenIn
        //             order.path[1], // tokenOut
        //             order.fee, // fee
        //             order.recipient, // recipient
        //             order.deadline, // deadline
        //             order.amountIn, // amountIn
        //             order.amountOut, // amountOutMinimum
        //             order.sqrtPriceLimitX96 // sqrtPriceLimitX96
        //         );
        //     emit ExactInputSingleSwap(order.recipient);
        //     // send order to router
        //     router.exactInputSingle(params);
        // } else if (stringsEqual(order.tradeType, "v3_exactOutputSingle")) {
        //     // router.exactOutputSingle(params);
        //     revert("unimplemented");
        // } else if (stringsEqual(order.tradeType, "v3_exactInput")) {
        //     // router.exactInput(params);
        //     revert("unimplemented");
        // } else if (stringsEqual(order.tradeType, "v3_exactOutput")) {
        //     // router.exactOutput(params);
        //     revert("unimplemented");
        // } else {
        //     // TODO: v2; ignore for now
        //     revert("unimplemented");
        // }
    }

    function verifyAndSend(
        SwapOrder memory order,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(verify(order, v, r, s), "invalid signature");
        sendOrder(order);
        status = status + 1;
    }

    // status reset for debugging
    function resetStatus() public {
        require(msg.sender == owner);
        status = 0;
    }
}
