import React, { useEffect, useState } from 'react'
import './App.css'
import { BigNumber } from 'ethers'
import { useMetaMask } from "metamask-react"
import axios from "axios"
import { Contract, providers } from "ethers"
import ABI from "./sonOfASwap.json"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const verifyingContract = "0x0F7c506dFc30aDaBa37B08f9a9c550e715cb5bAA"

function App() {
  const { status, connect, account, chainId, ethereum } = useMetaMask()
  const [actionStatus, setActionStatus] = useState<string>()
  const [success, setSuccess] = useState<boolean>()
  
  const provider = providers.getDefaultProvider(5)
  const swappyContract = new Contract(verifyingContract, ABI, provider)

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
          { name: "sender", type: "address" },
          { name: "functionName", type: "string" },
          { name: "value", type: "uint256" },
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
        sender: account,
        functionName: "swapEthForExactToken",
        value: amount._hex,
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
