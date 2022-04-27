#!/usr/bin/env ts-node
import yargs from 'yargs/yargs'
import assert from 'assert'
import { ethers } from 'ethers'
import { exec, Action, LimitBuyParams } from './exec'
import JSBI from 'jsbi'

const validate = (
    argv: any
): {
    network: ethers.providers.Network
    pairAddress: string
    ethAmount: JSBI
} => {
    return {
        pairAddress: validateAddress(argv.address),
        network: validateNetwork(argv.network),
        ethAmount: validateEthAmt(argv.ethAmount),
    }
}

const validateAddress = (addr: any): string => {
    assert(ethers.utils.isAddress(addr), 'bad address')
    return addr
}

const validateNetwork = (n: any): ethers.providers.Network => {
    const network = ethers.providers.getNetwork(n)
    assert(network != null, 'bad network')
    return network
}

const validateEthAmt = (amt: any): JSBI => {
    const a = JSBI.BigInt(amt)
    assert(JSBI.lessThan(a, JSBI.BigInt(30)), `too big buy ${a}`)
    return a
}

yargs(process.argv.slice(2))
    .command(
        'limit-buy',
        'limit buy with eth amount',
        (yargs) =>
            yargs.options({
                filepath: {
                    alias: 'fp',
                    describe: 'filepath',
                    default: 'keystore/keystore.json',
                    demandOption: false,
                },
                pairAddress: {
                    alias: 'p',
                    describe: 'address of pair',
                    demandOption: true,
                },
                network: {
                    alias: 'n',
                    describe: 'chainId or network name',
                    demandOption: true,
                },
                ethAmount: {
                    alias: 'a',
                    describe: 'eth amount to buy token w',
                    demandOption: true,
                },
            }),
        async (argv) => {
            const args = validate(argv)
            await exec({
                action: Action.LimitBuy,
                slippage: JSBI.BigInt(1), // TODO
                ...args,
            })
        }
    )
    .usage(
        'ts-node -T cli.ts limit-buy -p dfa6c4c6d96ff1dae93ef1fa82e4b94ea9776472 -amt 4 -n homestead'
    )
    .help().argv
