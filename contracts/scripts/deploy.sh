#!/bin/bash

CONTRACT=src/SonOfASwap.sol:SonOfASwap
BASE_ARGS="--rpc-url $RPC_URL --json $CONTRACT"

if [ "$1" == "-e" ]; then
    SHOW_ENV=1
fi

printEnv() {
    if [ "$SHOW_ENV" == "1" ]; then
        echo -e "RPC_URL\t\t\t$RPC_URL"
        echo -e "SIGNER_KEY\t\t$SIGNER_KEY"
        echo -e "CHAIN_OVERRIDE\t\t$CHAIN_OVERRIDE"
    fi
}

writeAddress() {
    echo $OUTPUT
    ADDRESS=$(echo $OUTPUT | jq .deployedTo)
    echo "{\"address\": $ADDRESS}" > contract.json
}

if [[ -f .env ]]; then
    echo "Loading '.env'..."
    # load .env
    set -a
    source <(cat .env | sed -e '/^#/d;/^\s*$/d' -e "s/'/'\\\''/g" -e "s/=\(.*\)/='\1'/g")
    set +a
    printEnv

    if [ -z $CHAIN_OVERRIDE ]; then
        echo "Using default CHAIN_ID"
    else
        CHAIN_ARG="--chain $CHAIN_OVERRIDE"
    fi

    echo "Deploying ($CONTRACT)..."
    # deploy
    OUTPUT=$(forge create --private-key $SIGNER_KEY $CHAIN_ARG $BASE_ARGS)
    writeAddress
else
    if [ -z $RPC_URL ]; then
        echo "RPC_URL environment variable must be set."
    else
        printEnv
        echo "Deploying contract with interactive mode..."
        # use interactive prompt
        script -q -c "forge create --interactive $BASE_ARGS" OUTPUT.txt
        OUTPUT=$(cat OUTPUT.txt | tail -n +4 | head -n 1)
        rm OUTPUT.txt
        writeAddress
    fi
fi

cp contract.json ../frontend/src/
