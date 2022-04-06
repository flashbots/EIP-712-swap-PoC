// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

struct SwapOrder {
    address sender;
    string functionName; // TODO: be enum
    uint256 value;
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
    
    string private constant EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)";
    string private constant SWAPORDER = "SwapOrder(address sender,string functionName,uint256 value)";

    bytes32 private constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));
    bytes32 private constant SWAPORDER_TYPEHASH = keccak256(abi.encodePacked(SWAPORDER));

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
        DOMAIN_SEPARATOR = hash(EIP712Domain({
            name: 'SonOfASwap',
            version: '1',
            chainId: getChainID(),
            verifyingContract: address(this)
        }));
    }

    function hash(EIP712Domain memory eip712Domain) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            EIP712_DOMAIN_TYPEHASH,
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
        address recovered = ecrecover(digest, v, r, s);
        return recovered == order.sender;
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
