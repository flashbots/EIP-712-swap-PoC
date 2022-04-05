// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract SonOfASwap {
    uint256 public status;
    address private owner;
    
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }
    
    struct SwapOrder {
        address sender;
        string functionName;
        uint256 value;
    }

    bytes32 private constant EIP712DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    bytes32 private constant SWAPORDER_TYPEHASH = keccak256(
        "SwapOrder(address sender,string functionName,uint256 value)"
    );

    bytes32 private DOMAIN_SEPARATOR;

    constructor() {
        owner = msg.sender;
        status = 0;
        DOMAIN_SEPARATOR = hash(EIP712Domain({
            name: 'SonOfASwap',
            version: '4',
            chainId: 5,
            verifyingContract: address(this)
        }));
    }

    function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            EIP712DOMAIN_TYPEHASH,
            keccak256(bytes(eip712Domain.name)),
            keccak256(bytes(eip712Domain.version)),
            eip712Domain.chainId,
            eip712Domain.verifyingContract
        ));
    }

    function hash(SwapOrder memory order) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            SWAPORDER_TYPEHASH,
            order.sender,
            keccak256(bytes(order.functionName)),
            order.value
        ));
    }

    function verify(SwapOrder memory order, uint8 v, bytes32 r, bytes32 s) internal view returns (bool) {
        // Note: we need to use `encodePacked` here instead of `encode`.
        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            hash(order)
        ));
        return ecrecover(digest, v, r, s) == order.sender;
    }

    function setIfValidSignature(SwapOrder memory order, uint8 v, bytes32 r, bytes32 s) public {
        require(verify(order, v, r, s), "invalid signature");
        status = status + 1;
    }

    // status reset for debugging
    function resetStatus() public {
        require(msg.sender == owner);
        status = 0;
    }
}
