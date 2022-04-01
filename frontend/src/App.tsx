import React, { useEffect, useState } from 'react'
import './App.css'
import { BigNumber } from 'ethers';
import { useMetaMask } from "metamask-react";
import axios from "axios"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const randomColor = () => Math.floor(Math.random()*16777215).toString(16)

function App() {
  const { status, connect, account, chainId, ethereum } = useMetaMask()
  const [actionStatus, setActionStatus] = useState<string>()
  const [color, setColor] = useState<string>()

  useEffect(() => {
    async function load() {
      if (!color) {
        setColor(`#${randomColor()}`)
      }
    }
    load()
  }, [color])

  const buyDai = (amount: BigNumber) => {
    const msgParams = [
      {
        type: 'string',
        name: 'function',
        value: 'swapEthForExactToken'
      },
      {
        type: 'uint256',
        name: 'value',
        value: amount._hex
      },
    ]
    setActionStatus(`buying ${amount.div(ETH)} DAI...`)
    ethereum.sendAsync({
      method: "eth_signTypedData",
      params: [msgParams, ethereum.selectedAddress],
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
          msgParams,
        }
        const postResponse = await axios.post(`${API_URL}/uniswap`, payload)
        console.log("POST response", postResponse)
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
        <div className='box'>
          <p><code>{actionStatus}</code></p>
        </div>
      </div>
      <button onClick={() => buyDai(BigNumber.from(5).mul(ETH))}>Buy 5 DAI</button>
    </div>
  );
}

export default App;
