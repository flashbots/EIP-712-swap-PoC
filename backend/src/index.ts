import express, {Request, Response} from "express"
import bodyParser from "body-parser"
import {SignTypedDataVersion, recoverTypedSignature} from "@metamask/eth-sig-util"
import cors from "cors"

import { SignedMessageRequest } from "./interfaces";

const app = express()
    .use(bodyParser.json())
    .use(cors())
const PORT = 8080; // default port to listen

// define a route handler for the default home page
app.get("/", (req: Request, res: Response) => {
    res.send("Hello world!");
});

app.post("/uniswap", (req: Request, res: Response) => {
    console.log("UNISWAP ORDER RECEIVED")
    try {
        const msgReq: SignedMessageRequest = req.body
        console.log(msgReq)
        const recovered = recoverTypedSignature({
            data: msgReq.msgParams,
            signature: msgReq.signedMessage,
            version: SignTypedDataVersion.V1,
            // TODO: use V4 instead of V1
        })
        console.log("recovered signature from", recovered)
        res.send({ok: true})
    } catch (e) {
        console.error("__signature recovery failed__", e)
        res.status(400).send()
    }

})

// start the Express server
app.listen(PORT, () => {
    console.log( `server started at http://localhost:${ PORT }` );
});
