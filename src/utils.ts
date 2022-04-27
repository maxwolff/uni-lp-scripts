import Database from 'better-sqlite3'
import BetterSqlite3 from 'better-sqlite3'
import { providers } from 'ethers'
import url from 'url'

export const getDB = (): BetterSqlite3.Database => {
    const dbPath = process.env.NODE_ENV == 'test' ? ':memory:' : 'test.db'
    return new Database(dbPath, { fileMustExist: true })
}

export const getProvider = (network: providers.Network) => {
    if (process.env.NODE_ENV == 'test') throw 'no provider in test'
    const base = exists(rpcMap[network.name])
    const key = exists(process.env.API_KEY)
    const finalUrl = url.resolve(base, key)
    return new providers.JsonRpcProvider(finalUrl)
}

export const exists = (expr: any) => {
    if (expr) {
        return expr
    } else {
        throw new ReferenceError('found an undefined')
    }
}

export const rpcMap: { [networkName: string]: string } = {
    homestead: 'https://eth-mainnet.alchemyapi.io/v2',
}

export const WETH: { [networkName: string]: string } = {
    homestead: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    kovan: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
    ropsten: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
}
