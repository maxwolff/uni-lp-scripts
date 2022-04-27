// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity >=0.5.0;

contract MockV3UniswapPool {
    address public token0;
    address public token1;
    uint128 public liquidity;
    uint24 public fee;

    struct Slot0 {
        // the current price
        uint160 sqrtPriceX96;
        // the current tick
        int24 tick;
        // the most-recently updated index of the observations array
        uint16 observationIndex;
        // the current maximum number of observations that are being stored
        uint16 observationCardinality;
        // the next maximum number of observations to store, triggered in observations.write
        uint16 observationCardinalityNext;
        // the current protocol fee as a percentage of the swap fee taken on withdrawal
        // represented as an integer denominator (1/x)%
        uint8 feeProtocol;
        // whether the pool is locked
        bool unlocked;
    }

    Slot0 public slot0;

    constructor(
            uint160 sqrtPriceX96_,
            int24 tick_,
            uint8 feeProtocol_,
            address token0_,
            address token1_,
            uint128 liquidity_,
            uint24 fee_
        ) {
            token0 = token0_;
            token1 = token1_;
            liquidity = liquidity_;
            fee = fee_;

            slot0 = Slot0({
                sqrtPriceX96: sqrtPriceX96_,
                tick: tick_,
                observationIndex: 1,
                observationCardinality: 1,
                observationCardinalityNext: 1,
                feeProtocol: feeProtocol_,
                unlocked: false
            });
        }
}