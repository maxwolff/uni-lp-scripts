import BetterSQLite from 'better-sqlite3';
import {
  insertPairRaw,
  insertTokenRaw,
  PairsRow,
  TokensRow,
} from '../src/controller';

export const migrate001 = (db: BetterSQLite.Database) => {
  db.exec(`
    CREATE TABLE pairs (
        CONSTRAINT id PRIMARY KEY(address, network)
        address TEXT,
        network TEXT,
        token0address TEXT,
        token1address TEXT,
        feeTierBPS INT
    )`);

  db.exec(`
    CREATE TABLE tokens (
        CONSTRAINT id PRIMARY KEY(address, network),
        address TEXT,
        network TEXT,
        decimals INT,
        name TEXT,
        symbol TEXT
    )
    `);

  db.exec(`
    CREATE TABLE strategies (
        id INT PRIMARY KEY AUTOINCREMENT,
        network TEXT,
        pairAddress TEXT,
        isAllowed BOOLEAN,
        strategy INT,
        isBuying BOOLEAN,
        liquidity INT,
        tickUpper NUMERIC,
        tickLower NUMERIC
    )
    `);
};

const pairsTestData: PairsRow[] = [
  {
    address: '0x123',
    network: 'kovan',
    token0address: '0x123',
    token1address: '0x123',
    feeTierBPS: 500,
  },
];

const testTokens: TokensRow[] = [
  {
    address: '0x123',
    network: 'kovan',
    symbol: 'abc',
    name: 'abc',
    decimals: 18,
  },
];

export const testData = (db: BetterSQLite.Database) => {
  for (let row of pairsTestData) {
    insertPairRaw(row, db);
  }
  for (let row of testTokens) {
    insertTokenRaw(row, db);
  }
};
