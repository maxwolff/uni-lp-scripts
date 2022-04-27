import { ethers } from "ethers";
import { Position, Pool } from "@uniswap/v3-sdk/";

enum Entry {
  LimtBuy, // set a 1 tick LP position to enter
  MarketBuy, // buy market to enter
  None, // account already has token
}

export class LPposition {
  public poolAddress: string;
  public position?: Position;
  public pool: Pool;
  public entry: Entry;
  public provider: ethers.providers.Provider;

  public network: ethers.providers.Network;

  public allowed: boolean;

  constructor(
    pool: Pool,
    entry: Entry,
    provider: ethers.providers.Provider,
    allowed: boolean,
    poolAddress: string
  ) {
    this.pool = pool;
    this.entry = entry;
    this.provider = provider;
  }

  public static slot0 = (provider) => {};

  public updatePool: {
    const pool = new Pool(
      TokenA,
      TokenB,
      immutables.fee,
      state.sqrtPriceX96.toString(),
      state.liquidity.toString(),
      state.tick
    );
  
  }
}

/*

For position
  get position
  get pool[pairAddress]
  get tokens[pool.tokenA]
  get tokens[pool.tokenB]
  get network.WETH

position [id]
  * network
  * pair address
  * allowed
  * strategy: market buy, none, limit buy
  * status: buying, LPing
  * position?
    * liquidity
    * tick upper
    * tick lower

pool - [network + address]
  * token a address
  * token b address
  * network 
  * pair address
  * fee tier

tokens [network + address]
  * address
  * decimals
  * name


*/
