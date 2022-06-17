const { Wallet } = require("ethers")

// test wallet
const wallet = new Wallet("0xf794d409aeda1fba6705b234aa836819c27d7e29aaa23d876a437bb79624dda1")
console.log("WALLET ADDRESS", wallet.address)

/**
 * Extracts {r, s, v} from hex-string signature.
 * @param rawSignature hex-string signature (e.g. "0x320d41a6aff0508d5393626fa4e284f815aa013203a8b5c3bd000a1eae2cb44a2c8c91ff3918f2267eedf5470f239f13babeee35d7e69e68a888045068a5034efa")
 * @returns {r,s,v}
 */
 const rsvFromRawSignature = (rawSignature) => {
    const signature = rawSignature.substring(2)
    const r = "0x" + signature.substring(0, 64)
    const s = "0x" + signature.substring(64, 128)
    const v = parseInt(signature.substring(128, 130), 16)
    return { r, s, v }
  }

DOMAIN = {
    name: "SonOfASwap",
    version: "1",
    chainId: "9001",
    verifyingContract: "0xce71065d4017f316ec606fe4422e11eb2c47c246",
}
TYPES = {
    // "EIP712Domain": [
    //     { name: "name", type: "string" },
    //     { name: "version", type: "string" },
    //     { name: "chainId", type: "uint256" },
    //     { name: "verifyingContract", type: "address" },
    // ],
    "SwapOrder": [
        { name: "router", type: "address" },
        { name: "amountIn", type: "uint256" },
        { name: "amountOut", type: "uint256" },
        { name: "tradeType", type: "string" },
        { name: "recipient", type: "address" },
        { name: "path", type: "address[]" },
        { name: "deadline", type: "uint" },
        { name: "sqrtPriceLimitX96", type: "uint256" },
        { name: "fee", type: "uint256" },
        { name: "nonce", type: "uint256" },
    ],
}
EXACT_INPUT_SINGLE_VALUE = {
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    amountIn: '1000000000000000',
    amountOut: '42',
    tradeType: 'v3_exactInputSingle',
    recipient: wallet.address,
    path: [
        '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        '0x7ebC3778cF08f636805D9382D6c16e79ed9F370E'
    ],
    deadline: '1655425026',
    sqrtPriceLimitX96: '0',
    fee: '3000',
    nonce: '0'
}

EXACT_INPUT_SINGLE_VALUE_BAD_NONCE = {
    router: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    amountIn: '1000000000000000',
    amountOut: '42',
    tradeType: 'v3_exactInputSingle',
    recipient: wallet.address,
    path: [
        '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
        '0x7ebC3778cF08f636805D9382D6c16e79ed9F370E'
    ],
    deadline: '1655425026',
    sqrtPriceLimitX96: '0',
    fee: '3000',
    nonce: '13'
}

const logSig = async (name, signature) => {
    console.log(`${name}
    v: ${signature.v}
    r: ${signature.r}
    s: ${signature.s}`)
}

async function main() {
    const exactInputSingleSignature = rsvFromRawSignature(await wallet._signTypedData(DOMAIN, TYPES, EXACT_INPUT_SINGLE_VALUE))
    logSig('exactInputSingle', exactInputSingleSignature)

    const exactInputSingleSignatureBadNonce = rsvFromRawSignature(await wallet._signTypedData(DOMAIN, TYPES, EXACT_INPUT_SINGLE_VALUE_BAD_NONCE))
    logSig('exactInputSingleBadNonce', exactInputSingleSignatureBadNonce)
    // TODO: add others
}
main()
