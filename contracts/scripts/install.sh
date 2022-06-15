#!/bin/bash

### install & alias solidity dependencies
forge install --no-commit --no-git \
@openzeppelin/contracts=https://github.com/OpenZeppelin/openzeppelin-contracts@v3.4.2 \
@uniswap/swap-router-contracts=https://github.com/Uniswap/swap-router-contracts \
@uniswap/v3-periphery=https://github.com/Uniswap/v3-periphery \
@uniswap/v3-core=https://github.com/Uniswap/v3-core
