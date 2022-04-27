const util = require('util')
const assert = require('assert')
const fs = require('fs')
import { ethers, Wallet } from 'ethers'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import JSBI from 'jsbi'
import { addLimitLiquidity } from './uniswap'
import { getProvider, rpcMap } from './utils'

export enum Action {
    LimitBuy,
    LimitSell,
}

interface ActionInterface {
    action: Action
    network: ethers.providers.Network
    pairAddress: string
}

export interface LimitBuyParams extends ActionInterface {
    ethAmount: JSBI
    slippage: JSBI
}

interface LimitSellParams extends ActionInterface {
    action: Action.LimitBuy
    ethAmount: JSBI
    slippage: JSBI
}

export const getWallet = async (
    filePath: string,
    password: string | undefined
): Promise<ethers.Wallet> => {
    try {
        assert(password != undefined, 'pass password env')
        password = String(password)
        const rf = await util.promisify(fs.readFile)
        const buffer = await rf(filePath)
        return ethers.Wallet.fromEncryptedJson(buffer.toString(), password)
    } catch (e) {
        throw e
    }
}

const inMemoryWallet = (pk: string): ethers.Wallet => {
    return new Wallet(pk)
}

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const sendTx = async (
    txParams: ethers.providers.TransactionRequest,
    wallet: ethers.Wallet,
    counter?: number
): Promise<TransactionResponse> => {
    try {
        return wallet.sendTransaction(txParams)
    } catch (e) {
        if (counter && counter >= 3) {
            throw e
        } else {
            console.log(e, 'retrying')
            sleep(5000)
            const newCounter = counter || 0
            return sendTx(txParams, wallet, newCounter + 1)
        }
    }
}

export const exec = async (args: LimitBuyParams | LimitSellParams) => {
    const { network }: ActionInterface = args
    const filePath = 'keystore/keystore.json'
    const provider = getProvider(network)

    let wallet
    if (process.env.PK != null) {
        wallet = inMemoryWallet(process.env.PK)
    } else {
        wallet = await getWallet(filePath, process.env.PASSWORD)
    }

    let calldata: string, value: string
    switch (args.action) {
        case Action.LimitBuy: {
            ;({ calldata, value } = await addLimitLiquidity(
                args.pairAddress,
                args.ethAmount,
                wallet.address,
                provider
            ))
            sendTx({ data: calldata, value }, wallet, network.chainId)
        }
    }
}

process.on('uncaughtException', (error) => {
    console.log('ERROR: ' + String(error))
    // other handling mechanisms
})
