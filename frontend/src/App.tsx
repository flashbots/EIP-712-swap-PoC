import React, { useEffect, useState } from 'react'
import './App.css'
import { BigNumber } from 'ethers';
import { useMetaMask } from "metamask-react";
import axios from "axios"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const randomColor = () => Math.floor(Math.random()*16777215).toString(16)
const verifyingContract = "0x1258615F6B06af9bA63CE940eEa404a61C3Db567"

function App() {
  const { status, connect, account, chainId, ethereum } = useMetaMask()
  const [actionStatus, setActionStatus] = useState<string>()
  const [color, setColor] = useState<string>()
  const [success, setSuccess] = useState<boolean>()

  useEffect(() => {
    async function load() {
      if (!color) {
        setColor(`#${randomColor()}`)
      }
    }
    load()
  }, [color])


  const buyDai = (amount: BigNumber) => {
    // raw type defs
    const domain = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
    ];
    const swapOrder = [
      { name: "sender", type: "address" },
      { name: "functionName", type: "string" },
      { name: "value", type: "uint256" },
    ]

    const domainData = {
      name: "SonOfASwap",
      version: "4",
      chainId,
      verifyingContract,
    }
    const msg = {
      sender: account,
      functionName: "swapEthForExactToken",
      value: amount._hex,
    }
    const data = {
      types: {
        EIP712Domain: domain,
        SwapOrder: swapOrder,
      },
      domain: domainData,
      primaryType: "SwapOrder",
      message: msg,
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

  return (
    <div className="App" style={{backgroundColor: color}}>
      {status === "notConnected" && <div className="box right">
        <button onClick={() => connect()}>Connect Wallet</button>
      </div>}
      <div>
        <p>{`Wallet ${status}`}</p>
        <p>{`Address: ${account}`}</p>
        <p>{`Chain: ${chainId}`}</p>
        <p>Verifier: <a href={`https://goerli.etherscan.io/address/${verifyingContract}`}>{verifyingContract}</a></p>
        <div className='box'>
          <p style={{wordWrap: "break-word"}}><code>{actionStatus}</code></p>
        </div>
      </div>
      <button disabled={success || !(status === "connected")} onClick={() => buyDai(BigNumber.from(5).mul(ETH))}>Buy 5 DAI</button>
    </div>
  );
}

export default App;
