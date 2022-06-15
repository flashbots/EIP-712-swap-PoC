#!/bin/bash

CONTRACT_NAME=SonOfASwap

forge build
ABI=$(cat out/$CONTRACT_NAME.sol/$CONTRACT_NAME.json | jq .abi)
echo $ABI > ../backend/src/abi/$CONTRACT_NAME.json
echo $ABI > ../frontend/src/abi/$CONTRACT_NAME.json
