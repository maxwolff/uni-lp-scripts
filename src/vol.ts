import { request, gql } from 'graphql-request';
import * as stats from 'simple-statistics';
import { Position, Pool } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { exists, feeToSpacing } from './utils';
import { ethers } from 'ethers';
import { graphEndpoints } from './utils';
import fs from 'fs';
import fetch from 'node-fetch';

interface PoolDayData {
  date: number;
  token0Price: string;
  volumeUSD: string;
}

interface PoolInfoFields {
  id: string;
  tick: string;
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  token0Price: string;
  token1Price: string;
  token0: TokenInfo;
  token1: TokenInfo;
  poolDayDatas: PoolDayData[];
}

const poolFieldsFragment = gql`
  fragment poolFields on Pools {
    id
    tick
    feeTier
    liquidity
    sqrtPrice
    tick
    token0Price
    token1Price
    token0 {
      symbol
      id
      decimals
    }
    token1 {
      symbol
      id
      decimals
    }
    poolDayDatas(orderBy: date, where: { date_gt: $date_gt }) {
      date
      token0Price
      volumeUSD
    }
  }
`;

interface PoolInfoResponse {
  pools: PoolInfoFields[];
}

interface TokenInfo {
  symbol: string;
  id: string;
  decimals: string;
}

const filename = 'data.json';

// 100ths of bips
const scaleFeeTier = (tier: number) => tier / 1000000;

const getETHprice = async (): Promise<string> => {
  const res = await fetch('https://prices.compound.finance');
  const data: any = await res.json();
  return data.coinbase.prices['ETH'];
};

export const analyzeTopPools = async (networkName: string) => {
  const pools = await getPoolsAgg(networkName, 7);
  let res = [];
  const ethPrice = await getETHprice();
  const results = pools.pools.map((pool: PoolInfoFields) =>
    analyze(pool, networkName, +ethPrice)
  );
  console.log(results);

  // fs.writeFile(filename, json, function (err: any) {
  //   if (err) return console.log(err);
  // console.log(`writing to file ${filename}`);
};

const getPoolsAgg = async (
  networkName: string,
  daysAgo: number
): Promise<PoolInfoResponse> => {
  const query: string = gql`
  query getPoolAgg($date_gt: Int!) {
      pools(
        first: 10
        orderBy: totalValueLockedUSD
        orderDirection: desc
        where: { txCount_gt: 20 }
      ) {
        ...poolFieldsFragment
      }
      ${poolFieldsFragment}
  }
  `;
  const date_gt = getDaysAgoTimestamp(daysAgo);

  const result = await graphRequest(query, { date_gt }, networkName);
  return result;
};

const getPool = async (
  poolAddress: string,
  networkName: string,
  daysAgo: number
): Promise<PoolInfoFields> => {
  const query: string = gql`
    query getPool($poolAddress: String!, $date_gt: Int!) {
      pool(id: $poolAddress) {
        ...poolFieldsFragment
      }
    ${poolFieldsFragment}
    }
  `;
  const date = getDaysAgoTimestamp(daysAgo);

  const variables = { date_gt: date, poolAddress: poolAddress.toLowerCase() };
  const data = await graphRequest(query, variables, networkName);
  return data.pool;
};

export const analyzeSingle = async (
  poolAddress: string,
  networkName: string
) => {
  const RVdays = 7;
  const pool: PoolInfoFields = await getPool(poolAddress, networkName, RVdays);
  const ethPrice = await getETHprice();
  const results = analyze(pool, networkName, +ethPrice);
  console.log(results);
};

export const analyze = (
  pool: PoolInfoFields,
  networkName: string,
  ethPrice: number
) => {
  const feeTier = scaleFeeTier(+pool.feeTier);
  let tickTVL;
  try {
    tickTVL = calcTickTVLeth(
      pool,
      networkName,
      pool.token0Price,
      pool.token1Price
    );
  } catch (e) {
    console.log(e, pool.token0.symbol, pool.token1.symbol);
    return {};
  }

  const latestDayVolume = +pool.poolDayDatas.sort((a, b) => b.date - a.date)[0]
    .volumeUSD;

  const histVol = calcHistoricalVolatility(pool.poolDayDatas);
  const implVol = calcImpliedVolatility(
    feeTier,
    latestDayVolume,
    tickTVL * +ethPrice
  );
  return {
    id: pool.id,
    meta: `${pool.token0.symbol} / ${pool.token1.symbol}, ${feeTier}. ${networkName}`,
    IV: implVol,
    RV: histVol,
  };
};

const calcTickTVLeth = (
  pi: PoolInfoFields,
  networkName: string,
  token0Price: string,
  token1Price: string
): number => {
  const tokenA = new Token(
    ethers.providers.getNetwork(networkName).chainId,
    pi.token0.id,
    +pi.token0.decimals,
    pi.token0.symbol
  );

  const tokenB = new Token(
    ethers.providers.getNetwork(networkName).chainId,
    pi.token1.id,
    +pi.token1.decimals,
    pi.token1.symbol
  );
  const pool = new Pool(
    tokenA,
    tokenB,
    +pi.feeTier,
    +pi.sqrtPrice,
    +pi.liquidity,
    +pi.tick
  );
  const tickSpacing: number = exists(feeToSpacing[+pi.feeTier]);
  const tickLower = Math.floor(+pi.tick / tickSpacing) * tickSpacing;
  const tickUpper = tickLower + tickSpacing;

  const pos = new Position({
    pool,
    liquidity: pi.liquidity,
    tickLower,
    tickUpper,
  });

  const amt0 = +pos.amount0.toFixed();
  const amt1 = +pos.amount1.toFixed();

  // token 0 == usdc
  // toekn1 == WETH
  if (pos.pool.token0.symbol == 'WETH') {
    return amt0 * +amt1 * +token0Price;
  } else if (pos.pool.token1.symbol == 'WETH') {
    return amt0 * +token1Price + amt1;
  } else {
    throw 'neither is weth';
  }
};

const calcHistoricalVolatility = (prices: PoolDayData[]) => {
  const logReturns: number[] = [];
  prices.forEach((val, idx, arr) => {
    if (idx != 0) {
      const periodReturn =
        Number(val.token0Price) / Number(arr[idx - 1].token0Price);
      const logReturn = Math.log(periodReturn);
      logReturns.push(logReturn);
    }
  });
  const vol = stats.standardDeviation(logReturns);
  return vol * Math.sqrt(365);
};

//https://lambert-guillaume.medium.com/on-chain-volatility-and-uniswap-v3-d031b98143d1
//
const calcImpliedVolatility = (
  scaledFee: number, //
  dailyVolume: number,
  tickTVL: number
) => {
  const daily = 2 * scaledFee * Math.sqrt(dailyVolume / tickTVL);
  return daily * Math.sqrt(365); // scale to yaer
};

const getDaysAgoTimestamp = (daysAgo: number): Number =>
  Math.round(new Date().getTime() / 1000 - 24 * 60 * 60 * daysAgo);

const graphRequest = async (
  query: string,
  variables: any,
  networkName: string
): Promise<any> => {
  const endpoint = exists(graphEndpoints[networkName]);
  try {
    return request(endpoint, query, variables);
  } catch (e) {
    throw `graph request err:${e}`;
  }
};
