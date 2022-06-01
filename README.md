# EIP-712 swap PoC

Uses strongly-typed signed messages to send "Uniswap orders" to a block builder (e.g. Flashbots).

## TODO

- [x] verify signed message
- [x] upgrade signed message type to V4
- [x] write smart contract (validator/executor) to decode tx and verify signature
- [x] send to uniswap from (validator/executor)
- [ ] implement v2 functions, use SwapRouter (v2 + v3) if possible

 ![i think this is how it works](/eip-712-diagram.png)
 
