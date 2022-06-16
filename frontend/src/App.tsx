import React, { useEffect, useState } from "react"
import "./App.css"
import { BigNumber, Contract, providers } from "ethers"
import { useMetaMask } from "metamask-react"
import axios from "axios"
import ERC20_ABI from "./abi/erc20.json"
import VALIDATOR_ABI from "./abi/SonOfASwap.json"
import validatorDeployment from "./contract.json"

const ETH = BigNumber.from(1e9).mul(1e9)
const API_URL = "http://localhost:8080"

const verifyingContractAddress = validatorDeployment.address
const TOKEN_IN_ADDRESS = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6" //  WETH
const TOKEN_MIDDLE_ADDRESS = "0x3041EfE098e2cde8420DD16c9fBF5bde630f6168" // test ERC20 (MNY2)
const TOKEN_OUT_ADDRESS = "0x7ebC3778cF08f636805D9382D6c16e79ed9F370E" // test ERC20 (MNY)
const TOKEN_IN_NAME = "WETH"
const TOKEN_OUT_NAME = "MNY"

const provider = providers.getDefaultProvider(5)
// const provider = new providers.JsonRpcProvider("http://localhost:8599", 5)
const validatorContract = new Contract(
  verifyingContractAddress,
  VALIDATOR_ABI,
  provider
)
const tokenInContract = new Contract(TOKEN_IN_ADDRESS, ERC20_ABI, provider)

interface SwapOrderMessage {
  router: string;
  amountIn: string;
  amountOut: string;
  tradeType: string;
  recipient: string;
  path: string[];
  deadline: string;
  sqrtPriceLimitX96: string;
  fee: string;
  nonce: string;
}

function App() {
  const { status, connect, account, chainId, ethereum } = useMetaMask()
  const [actionStatus, setActionStatus] = useState<string>()
  const [validatorTokenInAllowance, setValidatorTokenInAllowance] =
    useState<BigNumber>()
  const [tokenInBalance, setTokenInBalance] = useState<BigNumber>()
  const [swapNonce, setSwapNonce] = useState<BigNumber>()

  useEffect(() => {
    async function load() {
      console.log("load")
      if (account) {
        // get contract tokenIn allowance for user
        const allowance = await tokenInContract.allowance(
          account,
          verifyingContractAddress
        )
        console.log("allowance", allowance)
        if (
          (validatorTokenInAllowance &&
            !allowance.eq(validatorTokenInAllowance)) ||
          !validatorTokenInAllowance
        ) {
          setValidatorTokenInAllowance(allowance)
        }

        // get user tokenIn balance
        const tokenInBalanceRes: BigNumber = await tokenInContract.balanceOf(
          account
        )
        console.log("tokenIn balance", tokenInBalanceRes)
        setTokenInBalance(tokenInBalanceRes)

        // get user swap nonce
        const swapNonce: BigNumber = await validatorContract.nonces(account)
        setSwapNonce(swapNonce)
        console.log("swapNonce", swapNonce)

      } else {
        console.warn("account undefined")
      }
    }
    load()
  }, [validatorTokenInAllowance, account, actionStatus])

  // 0.001 ETH
  const maxUint = BigNumber.from(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  )
  const testAmount = BigNumber.from(1).mul(ETH).div(1000) // 0.001 (*10^18)

  const exactInputSingleMessage = (): SwapOrderMessage => {
    console.log("swapNonce", swapNonce)
    return {
      router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // proxy
      // router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // direct
      amountIn: testAmount.toString(),
      amountOut: "42", // amountOutMinimum
      tradeType: "v3_exactInputSingle",
      recipient: account || "0x0",
      path: [TOKEN_IN_ADDRESS, TOKEN_OUT_ADDRESS],
      deadline: (
        Math.floor((Date.now() + 30 * 60 * 1000) / 1000) - 13
      ).toString(), // 30 min from now
      sqrtPriceLimitX96: "0",
      fee: "3000",
      nonce: swapNonce?.toString() || "0",
    }
  }

  const exactOutputSingleMessage = (): SwapOrderMessage => {
    return {
    router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // proxy
    // router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // direct
    amountIn: tokenInBalance?.div(1000).toString() || "0", // amountInMaximum (use balance/1000 for demo purposes; uni ui will calculate accurately)
    amountOut: testAmount.toString(),
    tradeType: "v3_exactOutputSingle",
    recipient: account || "0x0",
    path: [TOKEN_IN_ADDRESS, TOKEN_OUT_ADDRESS],
    deadline: (
      Math.floor((Date.now() + 30 * 60 * 1000) / 1000) - 13
    ).toString(), // 30 min from now
    sqrtPriceLimitX96: "0",
    fee: "3000",
    nonce: swapNonce?.toString() || "0",
    }
  }

  const exactInputMessage = (): SwapOrderMessage => {
    return {
      router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // proxy
      // router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // direct
      amountIn: testAmount.toString(),
      amountOut: "42", // amountOutMinimum
      tradeType: "v3_exactInput",
      recipient: account || "0x0",
      path: [TOKEN_IN_ADDRESS, TOKEN_MIDDLE_ADDRESS, TOKEN_OUT_ADDRESS],
      deadline: (
        Math.floor((Date.now() + 30 * 60 * 1000) / 1000) - 13
      ).toString(), // 30 min from now
      sqrtPriceLimitX96: "0",
      fee: "3000",
      nonce: swapNonce?.toString() || "0",
    }
  }

  const exactOutputMessage = (): SwapOrderMessage => {
    return {
      router: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45", // proxy
      // router: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // direct
      amountIn: tokenInBalance?.div(1000).toString() || "0", // amountInMaximum (use balance/1000 for demo purposes; uni ui will calculate accurately)
      amountOut: testAmount.toString(),
      tradeType: "v3_exactOutput",
      recipient: account || "0x0",
      path: [TOKEN_IN_ADDRESS, TOKEN_MIDDLE_ADDRESS, TOKEN_OUT_ADDRESS],
      deadline: (
        Math.floor((Date.now() + 30 * 60 * 1000) / 1000) - 13
      ).toString(), // 30 min from now
      sqrtPriceLimitX96: "0",
      fee: "3000",
      nonce: swapNonce?.toString() || "0",
    }
  }

  const swapTokens = (message: any) => {
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
          { name: "amountIn", type: "uint256" },
          { name: "amountOut", type: "uint256" },
          { name: "tradeType", type: "string" },
          { name: "recipient", type: "address" },
          { name: "path", type: "address[]" },
          { name: "deadline", type: "uint" },
          { name: "sqrtPriceLimitX96", type: "uint256" },
          { name: "fee", type: "uint256" },
          { name: "nonce", type: "uint256" },
        ],
      },
      domain: {
        name: "SonOfASwap",
        version: "1",
        chainId,
        verifyingContract: verifyingContractAddress,
      },
      primaryType: "SwapOrder",
      message,
    }

    console.log("data", data)

    setActionStatus(`buying ${testAmount} ${TOKEN_OUT_NAME}...`)
    ethereum.sendAsync(
      {
        method: "eth_signTypedData_v4",
        params: [ethereum.selectedAddress, JSON.stringify(data)],
        from: ethereum.selectedAddress,
      },
      async (err: any, res: any) => {
        if (err) {
          console.error("err", err)
          setActionStatus(err.message)
        } else if (res.error) {
          console.log("res.error", res.error)
          setActionStatus(res.error.message.toString())
        } else if (!err && !res.error) {
          setActionStatus("order signed successfully")
          console.log("signature", res.result)
          const payload = {
            trade_signature: res.result,
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
      }
    )
  }

  const getContractStatus = async () => {
    const res = await validatorContract.status()
    alert(res.toString())
  }

  const approveValidatorContractSpendTokenIn = async () => {
    if (ethereum && account) {
      let tx = await tokenInContract.populateTransaction.approve(
        verifyingContractAddress,
        maxUint
      )
      tx = {
        from: account,
        ...tx,
      }
      console.log(tx)
      await ethereum
        .request({ method: "eth_sendTransaction", params: [tx] })
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
    return (
      !!validatorTokenInAllowance && validatorTokenInAllowance.gte(testAmount)
    )
  }

  const liquidate = async (tokenAddress: string) => {
    if (ethereum && account) {
      let tx = await validatorContract.populateTransaction.liquidate(
        tokenAddress
      )
      tx = {
        from: account,
        ...tx,
      }
      console.log(tx)
      await ethereum
        .request({ method: "eth_sendTransaction", params: [tx] })
        .then(() => {
          setActionStatus("liquidation success")
        })
        .catch((err: any) => {
          console.error(err)
          setActionStatus("liquidation failed")
        })
    }
  }

  return (
    <div className="App" style={{ backgroundColor: "#bfffd0" }}>
      {status === "notConnected" && (
        <div className="box right">
          <button onClick={() => connect()}>Connect Wallet</button>
        </div>
      )}
      <div>
        <p>{`Wallet ${status}`}</p>
        <p>{`SwapNonce: ${swapNonce}`}</p>
        <p>{`Address: ${account}`}</p>
        <p>{`Chain: ${chainId}`}</p>
        <p>
          Verifier:{" "}
          <a
            href={`https://goerli.etherscan.io/address/${verifyingContractAddress}`}
          >
            {verifyingContractAddress}
          </a>
        </p>
        <button onClick={getContractStatus}>Get contract status</button>
        <br />
        <button
          onClick={approveValidatorContractSpendTokenIn}
          disabled={isAllowanceSet()}
        >
          Allow SonOfASwap to spend ALL of your {TOKEN_IN_NAME}
        </button>
        <button
          onClick={() => {
            liquidate(TOKEN_IN_ADDRESS)
          }}
        >
          Liquidate tokenIn from contract
        </button>
        <div className="box">
          <p style={{ wordWrap: "break-word" }}>
            <code>{actionStatus}</code>
          </p>
        </div>
      </div>
      <button
        disabled={status !== "connected" || !isAllowanceSet()}
        onClick={() => swapTokens(exactInputSingleMessage())}
      >
        Buy 0.001 WETH worth of {TOKEN_OUT_NAME}
      </button>
      <button
        disabled={status !== "connected" || !isAllowanceSet()}
        onClick={() => swapTokens(exactOutputSingleMessage())}
      >
        Buy 0.001 {TOKEN_OUT_NAME} with WETH
      </button>
      <button
        disabled={status !== "connected" || !isAllowanceSet()}
        onClick={() => swapTokens(exactInputMessage())}
      >
        Buy 0.001 ETH worth of {TOKEN_OUT_NAME} via MNY2
      </button>
      <button
        disabled={status !== "connected" || !isAllowanceSet()}
        onClick={() => swapTokens(exactOutputMessage())}
      >
        Buy 0.001 {TOKEN_OUT_NAME} with WETH via MNY2
      </button>
      {/* TODO: add buttons for the three other v3 functions */}
    </div>
  )
}

export default App
