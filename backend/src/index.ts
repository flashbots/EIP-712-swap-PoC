import express, {Request, Response} from "express"
import bodyParser from "body-parser"
import {SignTypedDataVersion, recoverTypedSignature } from "@metamask/eth-sig-util"
import cors from "cors"
import { BigNumber, Contract, providers, Wallet } from "ethers"
import dotenv from "dotenv"

import { SignedMessageRequest } from "./interfaces";
import swapAbi from "./abi/SonOfASwap.json"
import { GWEI } from "./util"
import { address as validatorContractAddress } from "../../contracts/contract.json"

dotenv.config()

const DRY_RUN_RAW = process.env.DRY_RUN
const DRY_RUN = DRY_RUN_RAW && DRY_RUN_RAW !== "false" // only 'false' can trigger a real run

const PORT = 8080
const app = express()
    .use(bodyParser.json())
    .use(cors())
const provider = new providers.JsonRpcProvider(process.env.RPC_URL, 5)
// const provider = new providers.JsonRpcProvider("http://localhost:8599", 5)
const signer = new Wallet(process.env.SIGNER_KEY || "", provider)
const validatorContract = new Contract(validatorContractAddress, swapAbi, signer)

/**
 * Extracts {r, s, v} from hex-string signature.
 * @param rawSignature hex-string signature (0x012301230123012301230123012301230123...)
 * @returns {r,s,v}
 */
const rsvFromRawSignature = (rawSignature: string) => {
    const signature = rawSignature.substring(2)
    const r = "0x" + signature.substring(0, 64)
    const s = "0x" + signature.substring(64, 128)
    const v = parseInt(signature.substring(128, 130), 16)
    return { r, s, v }
}

app.get("/", (_req: Request, res: Response) => {
    res.send("Hello world!")
})

app.post("/uniswap", async (req: Request, res: Response) => {
    console.log("UNISWAP ORDER RECEIVED")
    try {
        const msgReq: SignedMessageRequest = req.body
        console.log("msgReq", JSON.stringify(msgReq))
        const recovered = recoverTypedSignature({
            data: msgReq.data,
            signature: msgReq.trade_signature,
            version: SignTypedDataVersion.V4,
        })
        console.log("VERIFIED SIGNED MESSAGE from", recovered)

        const { r, s, v } = rsvFromRawSignature(msgReq.trade_signature)
        const nonce = await signer.getTransactionCount()

        try {
            // send to smart contract
            console.log("order", JSON.stringify(msgReq.data.message))
            console.log(`v\t\t${v}`)
            console.log(`r\t\t${r}`)
            console.log(`s\t\t${s}`)
            console.log("message", msgReq.data.message)
            if (!DRY_RUN) {
                const verifySendRes = await validatorContract.verifyAndSend(
                    msgReq.data.message,
                    v, r, s,
                    {gasPrice: GWEI.mul(6), gasLimit: BigNumber.from(500000), nonce, value: 0}
                )
                console.log("verify send response", verifySendRes)

                // send pending tx hash before waiting for result
                res.send({pendingTx: verifySendRes})
                console.log("verify send result", await verifySendRes.wait())
            } else {
                console.log("Dry run complete.")
            }
        } catch (e) {
            console.error("__transaction reverted__", e)
            res.sendStatus(400)
        }
    } catch (e) {
        console.error("__signature recovery failed__", e)
        res.status(400).send()
    }
})

// start the Express server
app.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`)
});
