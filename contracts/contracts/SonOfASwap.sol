// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

struct SwapOrder {
    string functionName;
    uint256 value;
}

contract SonOfASwap {
    string private constant SWAP_ORDER_TYPE = "SwapOrder(string functionName,uint256 value)";
    string private constant EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)";
    uint256 constant chainId = 5;
    bytes32 constant salt = 0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558;
    // this address must be pre-calculated using deployer account
    address private constant sonOfAnAddress = 0x03CBb3AFf82d2d7f6750b1987a94d75f0ecaf1DC;

    uint256 public status = 0;
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    bytes32 private constant DOMAIN_SEPARATOR = keccak256(abi.encode(
        EIP712_DOMAIN,
        keccak256("SonOfASwap"),
        keccak256("5"),
        chainId,
        sonOfAnAddress,
        salt
    ));

    function hashSwap(SwapOrder memory order) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\\x19\\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                SWAP_ORDER_TYPE,
                order.functionName,
                order.value
            ))
        ));
    }

    function verify(SwapOrder memory order, address signer, bytes32 r, bytes32 s, uint8 v) private pure returns (bool) {
        return signer == ecrecover(hashSwap(order), v, r, s);
    }

    function verifyAndSend(SwapOrder memory order, address sender, uint8 v, bytes32 r, bytes32 s) public {
        // verify signature
        require(verify(order, sender, r, s, v), "signature invalid for this sender");

        // parse order params
        status = order.value; // test

        // this is where we will send order to uniswap
    }

    function resetStatus() public {
        require(msg.sender == owner);
        status = 0;
    }
}
