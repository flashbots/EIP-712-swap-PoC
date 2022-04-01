import express, {Request, Response} from "express"
import bodyParser from "body-parser"
import {SignTypedDataVersion, recoverTypedSignature} from "@metamask/eth-sig-util"
import cors from "cors"
import {providers} from "ethers"
import dotenv from "dotenv"

import { SignedMessageRequest } from "./interfaces";

dotenv.config()

const PORT = 8080
const app = express()
    .use(bodyParser.json())
    .use(cors())
const provider = new providers.JsonRpcProvider(process.env.RPC_URL, 5)

app.get("/", (req: Request, res: Response) => {
    res.send("Hello world!")
})

app.post("/uniswap", (req: Request, res: Response) => {
    console.log("UNISWAP ORDER RECEIVED")
    try {
        const msgReq: SignedMessageRequest = req.body
        console.log(msgReq)
        const recovered = recoverTypedSignature({
            data: msgReq.data,
            signature: msgReq.signedMessage,
            version: SignTypedDataVersion.V4,
        })
        console.log("verified signed message from", recovered)

        // parse (r,s,v)
        // ...

        res.send({ok: true})
    } catch (e) {
        console.error("__signature recovery failed__", e)
        res.status(400).send()
    }
})

// start the Express server
app.listen(PORT, () => {
    console.log(`server started at http://localhost:${PORT}`)
});
