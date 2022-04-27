import BetterSQLite from 'better-sqlite3'
import ethers from 'ethers'
import { getTokenMetadata, getPoolImmutables, Immutables } from './uniswap'

export interface PairsRow {
    address: string
    network: string
    token0address: string
    token1address: string
    feeTierBPS: Number
}

export interface TokensRow {
    address: string
    network: string
    decimals: Number
    name: string
    symbol: string
}

export interface PositionRow {
    network: string
    decimals: Number
    name: string
    symbol: string
}

export const insertUniquePair = async (
    address: string,
    network: ethers.providers.Network,
    provider: ethers.providers.Provider,
    db: BetterSQLite.Database
) => {
    const { fee, token0, token1 } = await getPoolImmutables(address, provider)
    insertPairRaw(
        {
            address: address,
            network: network.name,
            token0address: token0,
            token1address: token1,
            feeTierBPS: fee,
        },
        db
    )
}

export const insertPairRaw = (row: PairsRow, db: BetterSQLite.Database) => {
    const insertPairSQL = db.prepare(`
    INSERT INTO pairs (
        network, address,feeTierBPS, token0address,  token1address, 
    ) VALUES (
        network, @address, @feeTierBPS, @token0address, @token1address,
    )`)
    insertPairSQL.run(row)
}

export const insertToken = async (
    address: string,
    network: ethers.providers.Network,
    provider: ethers.providers.Provider,
    db: BetterSQLite.Database
) => {
    const prev = db.prepare(`
        SELECT * FROM tokens 
        WHERE id = (@address, @network)
    `)
    const addrs = prev.all({ address, network })
    if (addrs.length == 0) {
        const { decimals, symbol, name } = await getTokenMetadata(
            address,
            provider
        )
        insertTokenRaw(
            { network: network.name, address, decimals, symbol, name },
            db
        )
    }
}

export const insertTokenRaw = (row: TokensRow, db: BetterSQLite.Database) => {
    const insert = db.prepare(
        `INSERT INTO tokens (address, network, decimals, name, symbol) VALUES (@address, @network, @decimals, @name, @symbol)`
    )
    insert.run(row)
}
