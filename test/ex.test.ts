import { exec } from 'child_process'
import { describe } from 'yargs'

describe('insert tokens', () => {
    // const db = getDB()
    beforeAll(async () => {
        exec('npx hardhat node')
        const f = await fetch('http://127.0.0.1:8545/')
        console.log(f)
    })
    it('insertUniquePair', () => {
        console.log('here')
        // insertToken('abcdfdf', db)
    })
})
