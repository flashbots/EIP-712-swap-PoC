# EIP-712 swap PoC

Uses strongly-typed signed messages to send "Uniswap orders" to a block builder (e.g. Flashbots).

![i think this is how it works](/eip-712-diagram.png)

## Helpful stuff

* `contracts/` and `backend/` require that you `cp .env.example .env` and modify the contents to suit your needs

* `yarn start` will run `backend` and `frontend`.

* `cd contracts/ && yarn deploy-goerli`

### Tokens with Uniswap liquidity on Goerli

| Token | Address |
| ----- | ------- |
| MNY | 0x7ebC3778cF08f636805D9382D6c16e79ed9F370E |
| MNY2 | 0x3041EfE098e2cde8420DD16c9fBF5bde630f6168 |
| PMNY | 0xeBa14FbBbf1B10e7dB7EA5cAdDD52160aa8873f3 |
| WETH | 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6 |

graph edges represent existing liquidity pools:

![uniswap LP diagram](/uni-lp-diagram.jpg?raw=true)

## TODO

- [x] verify signed message
- [x] upgrade signed message type to V4
- [x] write smart contract (validator/executor) to decode tx and verify signature
- [x] send to uniswap from (validator/executor)
- [ ] ~~send (validator/executor) tx to flashbots~~ (not important for PoC)
