import {
  Pool,
  Position,
  NonfungiblePositionManager,
  nearestUsableTick,
  FeeAmount,
  TICK_SPACINGS,
} from '@uniswap/v3-sdk/';
import JSBI from 'jsbi';
import { ethers } from 'ethers';
import { Percent, Token, CurrencyAmount } from '@uniswap/sdk-core';
import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import { abi as IERC20Minimal } from '@uniswap/v3-core/artifacts/contracts/interfaces/IERC20Minimal.sol/IERC20Minimal.json';
import { getProvider } from './utils';

export interface Immutables {
  factory: string;
  token0: string;
  token1: string;
  fee: number;
  tickSpacing: number;
  maxLiquidityPerTick: ethers.BigNumber;
}

interface State {
  liquidity: ethers.BigNumber;
  sqrtPriceX96: ethers.BigNumber;
  tick: number;
  observationIndex: number;
  observationCardinality: number;
  observationCardinalityNext: number;
  feeProtocol: number;
  unlocked: boolean;
}

export async function getPoolImmutables(
  poolAddress: string,
  provider: ethers.providers.Provider
): Promise<{ token0: string; token1: string; fee: Number }> {
  const poolContract: ethers.Contract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  return {
    token0,
    token1,
    fee: Number(fee),
  };
}

export const getPoolState = async (
  poolAddress: string,
  provider: ethers.providers.Provider
): Promise<State> => {
  const poolContract: ethers.Contract = new ethers.Contract(
    poolAddress,
    IUniswapV3PoolABI,
    provider
  );
  const [liquidity, slot] = await Promise.all([
    poolContract.liquidity(),
    poolContract.slot0(),
  ]);

  return {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };
};

export const getTokenMetadata = async (
  tokenAddress: string,
  provider: ethers.providers.Provider
) => {
  const tokenContract = new ethers.Contract(
    tokenAddress,
    IERC20Minimal,
    provider
  );
  const [decimals, symbol, name] = await Promise.all([
    tokenContract.decimals(),
    tokenContract.symbol(),
    tokenContract.name(),
  ]);
  return { decimals, symbol, name };
};

// const initPool = async (poolAddress: string) => {
//   const provider = getProvider();
//   const poolContract: ethers.Contract = new ethers.Contract(
//     poolAddress,
//     IUniswapV3PoolABI,
//     provider
//   );
//   const [immutables, state] = await Promise.all([
//     getPoolImmutables(poolContract),
//     getPoolState(poolContract),
//   ]);

//   const token0Contract: ethers.Contract = new ethers.Contract(
//     immutables.token0.toString(),
//     IERC20Minimal,
//     provider
//   );
//   const token1Contract: ethers.Contract = new ethers.Contract(
//     immutables.token1.toString(),
//     IERC20Minimal,
//     provider
//   );

//   const [token1Decimals, token1Symbol, token1Name] = await Promise.all([
//     token1Contract.decimals(),
//     token1Contract.symbol(),
//     token1Contract.name(),
//   ]);

//   const [token0Decimals, token0Symbol, token0Name] = await Promise.all([
//     token0Contract.decimals(),
//     token0Contract.symbol(),
//     token0Contract.name(),
//   ]);

//   const TokenA = new Token(
//     1,
//     immutables.token0.toString(),
//     token0Decimals,
//     token0Symbol,
//     token0Name
//   );
//   const TokenB = new Token(
//     1,
//     immutables.token1.toString(),
//     token1Decimals,
//     token1Symbol,
//     token1Name
//   );

//   const pool = new Pool(
//     TokenA,
//     TokenB,
//     immutables.fee,
//     state.sqrtPriceX96.toString(),
//     state.liquidity.toString(),
//     state.tick
//   );

//   return pool;
// };

// export const addLimitLiquidity = async (
//   poolAddress: string,
//   amount0: JSBI,
//   recipient: string,
//   provider: ethers.providers.Provider
// ): Promise<{ calldata: string; value: string }> => {
//   const pool = await initPool(poolAddress);
//   const TICK_SPACING = TICK_SPACINGS[FeeAmount.LOW];
//   const tickLower = pool.tickCurrent + TICK_SPACING;
//   const tickUpper = pool.tickCurrent + TICK_SPACING * 2;
//   const liquidity = Position.fromAmount0({
//     pool,
//     tickLower,
//     tickUpper,
//     amount0,
//     useFullPrecision: false,
//   }).liquidity;
//   const position = new Position({
//     pool,
//     liquidity,
//     tickLower,
//     tickUpper,
//   });

//   const block = await provider.getBlock(provider.getBlockNumber());
//   const deadline = block.timestamp + 200;

//   return NonfungiblePositionManager.addCallParameters(position, {
//     slippageTolerance: new Percent(50, 10_000),
//     recipient: recipient,
//     deadline: deadline,
//   });
// };
