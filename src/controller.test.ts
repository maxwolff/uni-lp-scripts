// import { insertToken } from './controller'
// import { getDB } from './utils'
// import { migrate001, testData } from './migrate-001'
// import { Contract } from 'ethers'
// import { deployContract, MockProvider, solidity } from 'ethereum-waffle'
// import MockV3UniswapPool from '../build/MockV3UniswapPool.json'
// import TestERC20 from '../build/TestERC20.json'

// use(solidity)
// describe('insert tokens', () => {
//     const db = getDB()
//     beforeAll(() => {
//         migrate001(db)
//         testData(db)
//     })
//     it('insertUniquePair', () => {
//         insertToken('abcdfdf', db)
//     })
// })

// describe('BasicToken', () => {
//     const [wallet, walletTo] = new MockProvider().getWallets()
//     let token0: Contract
//     let token1: Contract
//     let pool: Contract

//     beforeEach(async () => {
//         const mockData = {}

//         token0 = await deployContract(wallet, TestERC20, [
//             100,
//             18,
//             'SYM1',
//             'SYMBOL1',
//         ])

//         token1 = await deployContract(wallet, TestERC20, [
//             100,
//             18,
//             'SYM2',
//             'SYMBOL2',
//         ])

//         pool = await deployContract(wallet, MockV3UniswapPool, [
//             0, //sqrtpricex96
//             0, // tick
//             token0.address,
//             token1.address,
//             500, //fee
//         ])
//     })

//     it('Assigns initial balance', async () => {
//         expect(await token.balanceOf(wallet.address)).to.equal(1000)
//     })

//     it('Transfer adds amount to destination account', async () => {
//         await token.transfer(walletTo.address, 7)
//         expect(await token.balanceOf(walletTo.address)).to.equal(7)
//     })

//     // it('Transfer emits event', async () => {
//     //     await expect(token.transfer(walletTo.address, 7))
//     //         .to.emit(token, 'Transfer')
//     //         .withArgs(wallet.address, walletTo.address, 7)
//     // })

//     // it('Can not transfer above the amount', async () => {
//     //     await expect(token.transfer(walletTo.address, 1007)).to.be.reverted
//     // })

//     // it('Can not transfer from empty account', async () => {
//     //     const tokenFromOtherWallet = token.connect(walletTo)
//     //     await expect(tokenFromOtherWallet.transfer(wallet.address, 1)).to.be
//     //         .reverted
//     // })

//     // it('Calls totalSupply on BasicToken contract', async () => {
//     //     await token.totalSupply()
//     //     expect('totalSupply').to.be.calledOnContract(token)
//     // })

//     // it('Calls balanceOf with sender address on BasicToken contract', async () => {
//     //     await token.balanceOf(wallet.address)
//     //     expect('balanceOf').to.be.calledOnContractWith(token, [wallet.address])
//     // })
// })
