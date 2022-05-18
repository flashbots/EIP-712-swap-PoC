import React, { useEffect, useState } from 'react'
import './App.css'
import { BigNumber, Contract, providers } from 'ethers'
import { useMetaMask } from "metamask-react"
import axios from "axios"
import ERC20_ABI from "./abi/erc20.json"
import VALIDATOR_ABI from "./abi/sonOfASwap.json"
import validatorDeployment from "./contract.json"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const verifyingContractAddress = validatorDeployment.address
const TOKEN_IN_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6" //  WETH
const TOKEN_OUT_ADDRESS = "0x7ebC3778cF08f636805D9382D6c16e79ed9F370E" // test ERC20
const TOKEN_IN_NAME = "WETH"
const TOKEN_OUT_NAME = "MNY"

const provider = providers.getDefaultProvider(5)
// const provider = new providers.JsonRpcProvider("http://localhost:8599", 5)
const validatorContract = new Contract(verifyingContractAddress, VALIDATOR_ABI, provider)
const tokenInContract = new Contract(TOKEN_IN_ADDRESS, ERC20_ABI, provider)

function App() {
  const { status, connect, account, chainId, ethereum } = useMetaMask()
  const [actionStatus, setActionStatus] = useState<string>()
  const [validatorTokenInAllowance, setValidatorTokenInAllowance] = useState<BigNumber>()

  useEffect(() => {
    async function load() {
      const getValidatorTokenInAllowance = async (): Promise<BigNumber> => {
        return await tokenInContract.allowance(account, verifyingContractAddress)
      }
      const allowance = await getValidatorTokenInAllowance()
      console.log("allowance", allowance)
      if ((validatorTokenInAllowance && !allowance.eq(validatorTokenInAllowance)) || !validatorTokenInAllowance) {
        setValidatorTokenInAllowance(allowance)
      }
    }
    load()
  }, [validatorTokenInAllowance, account, actionStatus])

  // 0.001 ETH
  const testAmount = BigNumber.from(1).mul(ETH).div(1000)

  const swapTokens = () => {
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
        verifyingContract: verifyingContractAddress,
      },
      primaryType: "SwapOrder",
      message: {
        // router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // proxy
        router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // direct
        amountIn: testAmount._hex,
        amountOut: "0x42",
        tradeType: "v3_exactInputSingle",
        recipient: account,
        path: [TOKEN_IN_ADDRESS, TOKEN_OUT_ADDRESS],
        deadline: Math.floor((Date.now() + 30 * 60 * 1000) / 1000) - 13, // 30 min from now
        sqrtPriceLimitX96: "0x00",
        fee: "3000",
      },
    }

    console.log("data", data)

    setActionStatus(`buying ${testAmount} ${TOKEN_OUT_NAME}...`)
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
        console.log("signature", res.result);
        const payload = {
          signedMessage: res.result,
          data,
        }
        try {
          const postResponse = await axios.post(`${API_URL}/uniswap`, payload)
          if (postResponse.status === 200) {
            setActionStatus(JSON.stringify(postResponse.data))
          }
        } catch (e) {
          setActionStatus(`Tx failed. ${JSON.stringify(e)}`)
        }
      }
    })
  }

  const getContractStatus = async () => {
    const res = await validatorContract.status()
    alert(res.toString())
  }

  const approveValidatorContractSpendTokenIn = async () => {
    if (ethereum && account) {
      let tx = await tokenInContract.populateTransaction.approve(verifyingContractAddress, testAmount)
      tx = {
        from: account,
        ...tx,
      }
      console.log(tx)
      await ethereum.request({method: 'eth_sendTransaction', params: [tx]})
        .then(() => {
          setActionStatus("WETH Spend Approval Sent")
        })
        .catch((err: any) => {
          console.error(err)
          setActionStatus("WETH Approval Failed")
        })
    }
  }

  const isAllowanceSet = (): boolean => {
    return !!validatorTokenInAllowance && validatorTokenInAllowance.gte(testAmount)
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
        <p>Verifier: <a href={`https://goerli.etherscan.io/address/${verifyingContractAddress}`}>{verifyingContractAddress}</a></p>
        <button onClick={getContractStatus}>Get contract status</button>
        <br />
        <button onClick={approveValidatorContractSpendTokenIn} disabled={isAllowanceSet()}>Allow SonOfASwap to spend your {TOKEN_IN_NAME}</button>
        <div className='box'>
          <p style={{wordWrap: "break-word"}}><code>{actionStatus}</code></p>
        </div>
      </div>
      <button disabled={status !== "connected" || !isAllowanceSet()} onClick={swapTokens}>Buy 0.001 ETH worth of {TOKEN_OUT_NAME}</button>
    </div>
  );
}

export default App;
