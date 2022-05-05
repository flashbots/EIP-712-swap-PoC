# EIP-712 swap PoC

Uses strongly-typed signed messages to send "Uniswap orders" to a block builder (e.g. Flashbots).

## TODO

- [x] verify signed message
- [x] upgrade signed message type to V4
- [x] write smart contract (validator/executor) to decode tx and verify signature
- [ ] send to uniswap from (validator/executor)
- [ ] send (validator/executor) tx to flashbots

 ![i think this is how it works](/eip-712-diagram.png)
 
