import React, { useEffect, useState } from 'react'
import './App.css'
import { BigNumber } from 'ethers'
import { useMetaMask } from "metamask-react"
import axios from "axios"
import { Contract, providers } from "ethers"
import ABI from "./sonOfASwap.json"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const verifyingContract = "0xcDeC2Ca988cc42B65Cb8Ca161B3b25d36D7fB459"
const DAI_ADDRESS = "0x587B3c7D9E252eFFB9C857eF4c936e2072b741a4"
const WETH_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"

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
        amountIn: amount._hex,
        amountOut: (amount.mul(3000))._hex, // 3000 DAI/ETH
        tradeType: "EXACT_INPUT_SINGLE_V3",
        recipient: account,
        path: [WETH_ADDRESS, DAI_ADDRESS],
        deadline: BigNumber.from(Math.floor((Date.now() + 30 * 60 * 1000) / 1000))._hex, // 30 min from now
        sqrtPriceLimitX96: 0x0,
        fee: 0x0,
      },
    }

    console.log("data", data)

    setActionStatus(`buying ${amount.div(ETH)} DAI...`)
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
        console.log("res", res)
        const payload = {
          signedMessage: res.result,
          data,
        }
        const postResponse = await axios.post(`${API_URL}/uniswap`, payload)
        if (postResponse.status === 200) {
          setSuccess(true)
          setActionStatus(JSON.stringify(postResponse.data))
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
      <button disabled={status !== "connected"} onClick={() => buyDai(BigNumber.from(5).mul(ETH))}>Buy 5 DAI</button>
    </div>
  );
}

export default App;
