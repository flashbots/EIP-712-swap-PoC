// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;
pragma abicoder v2;

// V3 SwapRouter
// import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
// V2V3 SwapRouter
import "@uniswap/swap-router-contracts/contracts/interfaces/ISwapRouter02.sol";
import "@openzeppelin/contracts/contracts/token/ERC20/IERC20.sol";

struct SwapOrder {
    address router;
    uint256 amountIn;
    uint256 amountOut;
    string tradeType; // enum? // "v3_exactInputSingle" | "v3_exactOutputSingle" | "v3_exactInput" | "v3_exactOutput" | "v2_swapExactTokensForTokens" | "v2_swapTokensForExactTokens"
    address recipient;
    address[] path;
    uint256 deadline;
    // v3
    uint256 sqrtPriceLimitX96; // uint160 represented as uint256 for golang compatibility // TODO: remove casting (fix golang lib)
    uint256 fee; // uint24 represented as uint256 for golang compatibility // TODO: remove casting (fix golang lib)
    // TODO: use fee[] since pools in the path might have different fees
    uint256 nonce;
}

contract SonOfASwap {
    uint256 public status;
    address private owner;
    mapping(address => uint256) public nonces;

    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    string private constant EIP712_DOMAIN =
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    string private constant SWAPORDER =
        "SwapOrder(address router,uint256 amountIn,uint256 amountOut,string tradeType,address recipient,address[] path,uint deadline,uint256 sqrtPriceLimitX96,uint256 fee,uint256 nonce)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH =
        keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant SWAPORDER_TYPEHASH =
        keccak256(abi.encodePacked(SWAPORDER));

    bytes32 private DOMAIN_SEPARATOR;

    function getChainID() internal pure returns (uint256) {
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
                    order.fee,
                    order.nonce
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

    /**
    Encodes multihop V3 path.
    https://docs.uniswap.org/protocol/guides/swaps/multihop-swaps
    */
    function encodeMultihopPath(address[] memory path, uint24 fee)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory encodedPath;
        for (uint256 i = 0; i < path.length; i++) {
            encodedPath = abi.encodePacked(encodedPath, path[i]);
            if (i < path.length - 1) {
                // path = abi.encodePacked(path, fees[i]); // TODO <<
                encodedPath = abi.encodePacked(encodedPath, fee);
            }
        }
        return encodedPath;
    }

    function sendOrder(SwapOrder memory order) internal {
        // instantiate router interface
        ISwapRouter02 router = ISwapRouter02(order.router);
        // instantiate input token interface
        IERC20 tokenIn = IERC20(order.path[0]);

        // transfer input token from user to (this)
        tokenIn.transferFrom(order.recipient, address(this), order.amountIn);
        // TODO: deal with refunds due to slippage (and later, realized MEV)

        // approve router to spend (this) tokenIn
        tokenIn.approve(order.router, order.amountIn);

        // choose router method based on order type
        if (stringsEqual(order.tradeType, "v3_exactInputSingle")) {
            // encode function params based on order
            IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter
                .ExactInputSingleParams(
                    order.path[0], // tokenIn
                    order.path[1], // tokenOut
                    uint24(order.fee), // fee
                    order.recipient, // recipient
                    // order.deadline, // deadline
                    order.amountIn, // amountIn
                    order.amountOut, // amountOutMinimum
                    uint160(order.sqrtPriceLimitX96) // sqrtPriceLimitX96
                );

            // send order to router
            router.exactInputSingle{value: 0x0}(params);
        } else if (stringsEqual(order.tradeType, "v3_exactOutputSingle")) {
            IV3SwapRouter.ExactOutputSingleParams memory params = IV3SwapRouter
                .ExactOutputSingleParams(
                    order.path[0], // tokenIn
                    order.path[1], // tokenOut
                    uint24(order.fee), // fee
                    order.recipient, // recipient
                    // order.deadline, // deadline
                    order.amountOut, // amountOut
                    order.amountIn, // amountInMaximum
                    uint160(order.sqrtPriceLimitX96) // sqrtPriceLimitX96
                );

            router.exactOutputSingle{value: 0x0}(params);
        } else if (stringsEqual(order.tradeType, "v3_exactInput")) {
            IV3SwapRouter.ExactInputParams memory params = IV3SwapRouter
                .ExactInputParams(
                    encodeMultihopPath(order.path, uint24(order.fee)), // path
                    order.recipient, // recipient
                    // order.deadline, // deadline
                    order.amountIn, // amountIn
                    order.amountOut // amountOutMinimum
                );
            router.exactInput{value: 0x0}(params);
        } else if (stringsEqual(order.tradeType, "v3_exactOutput")) {
            IV3SwapRouter.ExactOutputParams memory params = IV3SwapRouter
                .ExactOutputParams(
                    encodeMultihopPath(order.path, uint24(order.fee)), // path
                    order.recipient, // recipient
                    // order.deadline, // deadline
                    order.amountOut, // amountOut
                    order.amountIn // amountInMaximum
                );
            router.exactOutput{value: 0x0}(params);
        } else if (
            stringsEqual(order.tradeType, "v2_swapExactTokensForTokens")
        ) {
            router.swapExactTokensForTokens{value: 0x0}(
                order.amountIn, // amountIn
                order.amountOut, // amountOutMin
                order.path, // path
                order.recipient // to
            );
        } else if (
            stringsEqual(order.tradeType, "v2_swapTokensForExactTokens")
        ) {
            router.swapTokensForExactTokens{value: 0x0}(
                order.amountOut, // amountOut
                order.amountIn, // amountInMax
                order.path, // path
                order.recipient // to
            );
        } else {
            revert("METHOD_DNE");
        }
    }

    function verifyAndSend(
        SwapOrder memory order,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public {
        require(verify(order, v, r, s), "invalid signature");
        if (order.nonce == nonces[order.recipient]) {
            sendOrder(order);
            nonces[order.recipient] += 1;
        } else {
            revert("INVALID_NONCE");
        }
    }

    // liquidate assets from this contract (for testing purposes only)
    function liquidate(address tokenAddress) public {
        require(msg.sender == owner);
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);
    }
}
