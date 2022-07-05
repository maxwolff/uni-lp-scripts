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
        count: {
          alias: 'c',
          describe: 'number of top pools to look at',
          demandOption: false,
          default: 10,
        },
      }),
    async (argv) => {
      const network = validateNetwork(argv.network);
      let result;
      if (!argv.pairAddress) {
        result = await analyzeTopPools(network.name, argv.count);
      } else {
        const addr = validateAddress(argv.pairAddress);
        result = await analyzeSingle(addr, network.name);
      }
      console.log(result);
    }
  )
  .usage(
    'ts-node -T src/analyze.ts analyze -p 0x92560C178cE069CC014138eD3C2F5221Ba71f58a -n homestead'
  )
  .help().argv;

// fs.writeFile(filename, json, function (err: any) {
//   if (err) return console.log(err);
// console.log(`writing to file ${filename}`);
