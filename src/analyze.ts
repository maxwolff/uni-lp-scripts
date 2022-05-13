#!/usr/bin/env ts-node
import yargs from 'yargs/yargs';
import { ethers } from 'ethers';
import { analyzeSingle, analyzeTopPools } from './vol';

const validateAddress = (addr: string): string => {
  try {
    return ethers.utils.getAddress(addr);
  } catch (e) {
    throw e;
  }
};

const validateNetwork = (n: any): ethers.providers.Network => {
  try {
    return ethers.providers.getNetwork(n);
  } catch (e) {
    throw e;
  }
};

yargs(process.argv.slice(2))
  .command(
    'analyze',
    'analyze pair profitability',
    (yargs) =>
      yargs.options({
        pairAddress: {
          alias: 'p',
          describe: 'address of pair',
          string: true,
        },
        network: {
          alias: 'n',
          describe: 'chainId or network name',
          demandOption: true,
        },
      }),
    async (argv) => {
      const network = validateNetwork(argv.network);
      if (!argv.pairAddress) {
        await analyzeTopPools(network.name);
      } else {
        const addr = validateAddress(argv.pairAddress);
        const res = await analyzeSingle(addr, network.name);
        console.log(res);
      }
    }
  )
  .usage(
    'ts-node -T src/analyze.ts -p 0x92560C178cE069CC014138eD3C2F5221Ba71f58a -n homestead'
  )
  .help().argv;
