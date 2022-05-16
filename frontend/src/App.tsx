import React, { useEffect, useState } from 'react'
import './App.css'
import { BigNumber } from 'ethers'
import { useMetaMask } from "metamask-react"
import axios from "axios"
import { Contract, providers } from "ethers"
import ABI from "./sonOfASwap.json"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const verifyingContract = "0x99D72ccAa651EEdf7Ece658c1f8aAa7f3f9778B2"
const WETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984"

const provider = providers.getDefaultProvider(5)
const swappyContract = new Contract(verifyingContract, ABI, provider)

function App() {
  const { status, connect, account, chainId, ethereum } = useMetaMask()
  const [actionStatus, setActionStatus] = useState<string>()
  const [success, setSuccess] = useState<boolean>()

  const buyDai = (amount: BigNumber) => {
    const data = {
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        SwapOrder: [
          { name: "router", type: "address" },
          { name: "amountIn", type: "uint256"},
          { name: "amountOut", type: "uint256"},
          { name: "tradeType", type: "string"},
          { name: "recipient", type: "address"},
          { name: "path", type: "address[]"},
          { name: "deadline", type: "uint"},
          { name: "sqrtPriceLimitX96", type: "uint160"},
          { name: "fee", type: "uint24"},
        ],
      },
      domain: {
        name: "SonOfASwap",
        version: "1",
        chainId,
        verifyingContract,
      },
      primaryType: "SwapOrder",
      message: {
        router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
        amountIn: amount._hex,
        amountOut: "0x42",
        tradeType: "v3_exactInputSingle",
        recipient: account,
        path: [WETH_ADDRESS, UNI_ADDRESS],
        deadline: BigNumber.from(Math.floor((Date.now() + 30 * 60 * 1000) / 1000) - 13)._hex, // 30 min from now
        sqrtPriceLimitX96: "0x0",
        fee: "0x0",
      },
    }

    console.log("data", data)

    setActionStatus(`buying ${amount} UNI...`)
    ethereum.sendAsync({
      method: "eth_signTypedData_v4",
      params: [ethereum.selectedAddress, JSON.stringify(data)],
      from: ethereum.selectedAddress,
    }, async (err: any, res: any) => {
      if (err) {
        console.error("err", err)
        setActionStatus(err.message)
      }
      else if (res.error) {
        console.log("res.error", res.error)
        setActionStatus(res.error.message.toString())
      }
      else if (!err && !res.error) {
        setActionStatus("order signed successfully")
        console.log("*!*!* res", res);
        const payload = {
          signedMessage: res.result,
          data,
        }
        try {
          const postResponse = await axios.post(`${API_URL}/uniswap`, payload)
          if (postResponse.status === 200) {
            setSuccess(true)
            setActionStatus(JSON.stringify(postResponse.data))
          }
        } catch (e) {
          setSuccess(false)
          setActionStatus(`Tx failed. ${JSON.stringify(e)}`)
        }
      }
    })
  }

  const getContractStatus = async () => {
    const res = await swappyContract.status()
    console.log(res)
    alert(res.toString())
  }

  return (
    <div className="App" style={{backgroundColor: "#bfffd0"}}>
      {status === "notConnected" && <div className="box right">
        <button onClick={() => connect()}>Connect Wallet</button>
      </div>}
      <div>
        <p>{`Wallet ${status}`}</p>
        <p>{`Address: ${account}`}</p>
        <p>{`Chain: ${chainId}`}</p>
        <p>Verifier: <a href={`https://goerli.etherscan.io/address/${verifyingContract}`}>{verifyingContract}</a></p>
        <button onClick={getContractStatus}>Get contract status</button>
        <div className='box'>
          <p style={{wordWrap: "break-word"}}><code>{actionStatus}</code></p>
        </div>
      </div>
      <button disabled={status !== "connected"} onClick={() => buyDai(BigNumber.from(1).mul(ETH).div(10))}>Buy 0.1 ETH worth of UNI</button>
    </div>
  );
}

export default App;
