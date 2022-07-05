import { request, gql } from 'graphql-request';
import * as stats from 'simple-statistics';
import { Position, Pool } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { exists, feeToSpacing } from './utils';
import { ethers } from 'ethers';
import { graphEndpoints } from './utils';

interface PoolAnalysis {
  id: string;
  meta: string;
  IV: number;
  RV: number;
  tickTVL: number;
  naiveAPY: number;
  diff: number;
  dailyFees: string;
}

interface PoolDayData {
  date: number;
  token0Price: string;
  volumeUSD: string;
  feesUSD: string;
}

interface PoolInfoFields {
  id: string;
  feeTier: string;
  liquidity: string;
  sqrtPrice: string;
  tick: string;
  totalValueLockedUSD: string;
  token0Price: string;
  token1Price: string;
  token0: TokenInfo;
  token1: TokenInfo;
  poolDayData: PoolDayData[];
}

interface TokenInfo {
  symbol: string;
  id: string;
  decimals: string;
  tokenDayData: [
    {
      priceUSD: string;
      date: string;
    }
  ];
}

const poolFieldsFragment = gql`
    id
    tick
    feeTier
    liquidity
    sqrtPrice
    tick
    totalValueLockedUSD
    token0Price
    token1Price
    token0 {
      symbol
      id
      decimals
      tokenDayData(first:1, orderBy:date, orderDirection: desc){
        priceUSD
        date
      }
    }
    token1 {
      symbol
      id
      decimals
      tokenDayData(first:1, orderBy:date, orderDirection: desc){
        priceUSD
        date
      }
    }
    poolDayData(orderBy: date, where: { date_gt: $date_gt }) {
      date
      token0Price
      volumeUSD
      feesUSD
    }
`;

const getDaysAgoTimestamp = (daysAgo: number): number =>
  Math.round(new Date().getTime() / 1000 - 24 * 60 * 60 * daysAgo);

// 100ths of bips
const scaleFeeTier = (tier: number) => tier / 1000000;

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

// "day data" gets cut off between days, so we take the average of the last two days
const averageDayAggregate = (
  poolDayData: PoolDayData[],
  daysAgo: number,
  key: 'feesUSD' | 'volumeUSD'
): number => {
  const ts = getDaysAgoTimestamp(daysAgo);
  const lastNDays = poolDayData.filter((e) => e.date > ts);
  const total = lastNDays.reduce(
    (acc: number, val: PoolDayData) => acc + +val[key],
    0
  );
  const lowestTimestamp = lastNDays.sort((a, b) => +a.date - +b.date)[0]?.date;
  const days = (getDaysAgoTimestamp(0) - lowestTimestamp) / (24 * 60 * 60);
  return total / days;
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

const calcTickTVLusd = (pi: PoolInfoFields, networkName: string): number => {
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

  return (
    amt0 * +pi.token0.tokenDayData[0].priceUSD +
    amt1 * +pi.token1.tokenDayData[0].priceUSD
  );
};

const getPoolsAgg = async (
  networkName: string,
  daysAgo: number,
  count: number
): Promise<PoolInfoFields[]> => {
  const query: string = gql`
    query getPoolAgg($date_gt: Int!, $count: Int!) {
        bundles {
          ethPriceUSD
        }
        pools(
          first: $count
          orderBy: volumeUSD
          orderDirection: desc
          where: { txCount_gt: 20, feesUSD_gt: 10000, totalValueLockedUSD_gt: 20000 }
        ) {
          liquidityProviderCount
          ${poolFieldsFragment}
        }
    }
    `;
  const date_gt = getDaysAgoTimestamp(daysAgo);
  const result = await graphRequest(query, { date_gt, count }, networkName);
  return exists(result.pools);
};

const getPool = async (
  poolAddress: string,
  networkName: string,
  daysAgo: number
): Promise<PoolInfoFields> => {
  const query: string = gql`
    query getPool($poolAddress: String!, $date_gt: Int!) {
      bundles {
          ethPriceUSD
        }
      pool(id: $poolAddress) {
        ${poolFieldsFragment}
      }
    }
    `;
  const date = getDaysAgoTimestamp(daysAgo);
  const variables = { date_gt: date, poolAddress: poolAddress.toLowerCase() };

  const result = await graphRequest(query, variables, networkName);
  return exists(result.pool);
};

export const analyze = (
  pool: PoolInfoFields,
  networkName: string
): PoolAnalysis => {
  const feeTier = scaleFeeTier(+pool.feeTier);
  let tickTVLUSD = calcTickTVLusd(pool, networkName);
  const latestDayVolume = averageDayAggregate(pool.poolDayData, 2, 'volumeUSD');
  const naiveAPY = (365 * latestDayVolume * feeTier) / tickTVLUSD;

  const histVol = calcHistoricalVolatility(pool.poolDayData);
  const implVol = calcImpliedVolatility(feeTier, latestDayVolume, tickTVLUSD);
  return {
    id: pool.id,
    meta: `${pool.token0.symbol} / ${pool.token1.symbol}, ${feeTier} ${networkName}`,
    IV: implVol,
    RV: histVol,
    diff: implVol - histVol,
    tickTVL: tickTVLUSD,
    naiveAPY: naiveAPY,
    dailyFees: `${Math.floor(latestDayVolume * feeTier) / 1000}k`,
  };
};

export const analyzeSingle = async (
  poolAddress: string,
  networkName: string
): Promise<PoolAnalysis> => {
  const RVdays = 7;
  const pool = await getPool(poolAddress, networkName, RVdays);
  return analyze(pool, networkName);
};

export const analyzeTopPools = async (
  networkName: string,
  count: number
): Promise<PoolAnalysis[]> => {
  const daysAgo = 7;
  let pools = await getPoolsAgg(networkName, daysAgo, count);
  let results = [];

  for (let pool of pools) {
    if (pool.poolDayData.length > 3) {
      if (+averageDayAggregate(pool.poolDayData, 2, 'feesUSD') > 500) {
        try {
          results.push(analyze(pool, networkName));
        } catch (e) {}
      } else {
        // console.log(
        //   pool.id,
        //   pool.poolDayData,
        //   +averageDayAggregate(pool.poolDayData, 2, 'feesUSD')
        // );
      }
    }
  }

  return results.sort((a, b) => b.diff - a.diff);
};
