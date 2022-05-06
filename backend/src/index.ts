import express, {Request, Response} from "express"
import bodyParser from "body-parser"
import {SignTypedDataVersion, recoverTypedSignature } from "@metamask/eth-sig-util"
import cors from "cors"
import { BigNumber, Contract, providers, Wallet } from "ethers"
import dotenv from "dotenv"

import { SignedMessageRequest } from "./interfaces";
import swapAbi from "./abi/sonOfASwap.json"
import { GWEI } from "./util"

dotenv.config()

const PORT = 8080
const app = express()
    .use(bodyParser.json())
    .use(cors())
const provider = new providers.JsonRpcProvider(process.env.RPC_URL, 5)
// const provider = new providers.JsonRpcProvider("http://localhost:8545", 31337)
const signer = new Wallet(process.env.SIGNER_KEY || "", provider)
const swappyContract = new Contract("0xe19e68880300cA7Bae0D79c300d3567f67cD686F", swapAbi, signer)

app.get("/", (req: Request, res: Response) => {
    res.send("Hello world!")
})

app.post("/uniswap", async (req: Request, res: Response) => {
    console.log("UNISWAP ORDER RECEIVED")
    try {
        const msgReq: SignedMessageRequest = req.body
        console.log("msgReq", msgReq)
        const recovered = recoverTypedSignature({
            data: msgReq.data,
            signature: msgReq.signedMessage,
            version: SignTypedDataVersion.V4,
        })
        console.log("verified signed message from", recovered)

        // parse (r,s,v)
        const signature = msgReq.signedMessage.substring(2)
        const r = "0x" + signature.substring(0, 64)
        const s = "0x" + signature.substring(64, 128)
        const v = parseInt(signature.substring(128, 130), 16)

        try {
            // send to smart contract
            console.log("order", msgReq.data.message)
            console.log("v", v)
            console.log("r", r)
            console.log("s", s)
            const verifySendRes = await swappyContract.setIfValidSignature(
                msgReq.data.message,
                v, r, s,
                {gasPrice: GWEI.mul(13), gasLimit: BigNumber.from(69000)}
            )
            console.log("verify send response", verifySendRes)
            console.log("verify send result", await verifySendRes.wait())
        } catch (e) {
            console.error(e)
        }

        res.send({v,r,s})
    } catch (e) {
        console.error("__signature recovery failed__", e)
        res.status(400).send()
    }
})

// start the Express server
app.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`)
});
