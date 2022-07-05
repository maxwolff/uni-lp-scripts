import Database from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { providers } from 'ethers';

export const getDB = (): BetterSqlite3.Database => {
  const dbPath = process.env.NODE_ENV == 'test' ? ':memory:' : 'test.db';
  return new Database(dbPath, { fileMustExist: true });
};

export const getProvider = (network: providers.Network) => {
  if (process.env.NODE_ENV == 'test') throw 'no provider in test';
  const base = exists(rpcMap[network.name]);
  const key = exists(process.env.API_KEY);
  const finalUrl = `${base}/${key}`;
  return new providers.JsonRpcProvider(finalUrl);
};

export const exists = (expr: any) => {
  if (expr) {
    return expr;
  } else {
    throw new ReferenceError('found an undefined');
  }
};
// ts-node src/analyze.ts analyze -p 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 -n homestead

export const rpcMap: { [networkName: string]: string } = {
  homestead: 'https://eth-mainnet.alchemyapi.io/v2',
};

export const WETH: { [networkName: string]: string } = {
  homestead: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  kovan: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
  ropsten: '0xc778417E063141139Fce010982780140Aa0cD5Ab',
  polygon: '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619',
  optimism: '0x4200000000000000000000000000000000000006',
};

export const graphEndpoints: { [networkName: string]: string } = {
  homestead: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  matic: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
  arbitrum: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-dev',
  optimism:
    'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
  test: 'eo7jn7q5s8yvtgn.m.pipedream.net',
};

export const feeToSpacing: { [fee: string]: number } = {
  '100': 1,
  '500': 10,
  '3000': 60,
  '10000': 200,
};
