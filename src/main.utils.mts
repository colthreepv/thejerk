import { BitGetFutures } from './bitget.mjs'
import { BitGetOrderSide } from './bitget/bitget.private.interfaces.mjs'

import { ByBitFutures } from './bybit.mjs'
import { ByBitOrderSide } from './bybit/bybit.private.interfaces.mjs'
import { addFundingOccurrence } from './funding.util.mjs'
import {
  ComputingFundingRate,
  ContractOccurrence,
  FundingRateSide,
  ResultingFundingRate,
} from './interfaces.common.mjs'
import { medianPrice, priceSpread, priceSpread, roundFloatTo2Decimals } from './math.util.mjs'

export const BitGetMostProfitableSymbol = async () => {
  const bitget = new BitGetFutures()
  const allSymbols = await bitget.getSymbols()

  // get all funding rates
  console.log(`querying ${allSymbols.length} funding rates...`)
  const fundingRates = await Promise.all(allSymbols.map((s) => bitget.getCurrentFundingRate(s.symbol)))

  const sortedFundingRates = fundingRates.sort((a, b) => b.apr - a.apr)

  return sortedFundingRates
}

export const ByBitMostProfitableSymbol = async () => {
  const bybit = new ByBitFutures()
  const allSymbols = await bybit.getSymbols()

  // get all funding rates
  console.log(`querying ${allSymbols.length} funding rates...`)
  const fundingRates = await Promise.all(allSymbols.map((s) => bybit.getCurrentFundingRate(s.name)))

  const sortedFundingRates = fundingRates.sort((a, b) => b.apr - a.apr)

  return sortedFundingRates
}

export const mostProfitableSymbol = async (): Promise<ResultingFundingRate[]> => {
  const [bybitProfitable, bitgetProfitable] = await Promise.all([
    ByBitMostProfitableSymbol(),
    BitGetMostProfitableSymbol(),
  ])

  const cexMap = { bybit: new ByBitFutures(), bitget: new BitGetFutures() } as any

  const fundingMap = new Map<string, ComputingFundingRate>()
  bybitProfitable.forEach((f) => {
    const isPresent = fundingMap.has(f.baseCurrency)
    if (isPresent) {
      const currentValue = fundingMap.get(f.baseCurrency)!
      const nextValue = addFundingOccurrence(currentValue, f, 'bybit')
      fundingMap.set(f.baseCurrency, nextValue)
    } else {
      const nextValue = addFundingOccurrence(
        { baseCurrency: f.baseCurrency, resultingApr: 0, allMatches: [] },
        f,
        'bybit',
      )
      fundingMap.set(f.baseCurrency, nextValue)
    }
  })

  bitgetProfitable.forEach((f) => {
    const isPresent = fundingMap.has(f.baseCurrency)
    if (isPresent) {
      const currentValue = fundingMap.get(f.baseCurrency)!
      const nextValue = addFundingOccurrence(currentValue, f, 'bitget')
      fundingMap.set(f.baseCurrency, nextValue)
    } else {
      const nextValue = addFundingOccurrence(
        { baseCurrency: f.baseCurrency, resultingApr: 0, allMatches: [] },
        f,
        'bitget',
      )
      fundingMap.set(f.baseCurrency, nextValue)
    }
  })

  const fundingRates = Array.from(fundingMap.values())
    .filter((value) => value.longApr !== undefined && value.shortApr !== undefined)
    .sort((a, b) => b.resultingApr - a.resultingApr)
    .filter((_, idx) => idx < 10)

  const result = await Promise.all(
    fundingRates.map(async (solution) => {
      const longCex = cexMap[solution.longMatch!.platform]
      const shortCex = cexMap[solution.shortMatch!.platform]

      const shortVolume24h: string = await shortCex.getVolume(solution.shortMatch!.baseCurrency)
      const shortPrice: string = await shortCex.getSimplePrice(solution.shortMatch!.baseCurrency)
      const longVolume24h: string = await longCex.getVolume(solution.longMatch!.baseCurrency)
      const longPrice: string = await longCex.getSimplePrice(solution.longMatch!.baseCurrency)

      const shortMatch: ContractOccurrence = Object.assign({}, solution.shortMatch!, {
        volume24h: shortVolume24h,
        price: shortPrice,
      })
      const longMatch: ContractOccurrence = Object.assign({}, solution.longMatch, {
        volume24h: longVolume24h,
        price: longPrice,
      })

      return Object.assign({}, solution, {
        priceSpread: priceSpread(longPrice, shortPrice),
        shortMatch,
        longMatch,
        allMatches: [shortMatch, longMatch],
      }) as ResultingFundingRate
    }),
  )

  return result
}

export const createFundingOrder = async (
  rawSymbol: string,
  longMatch: ContractOccurrence,
  shortMatch: ContractOccurrence,
  value: number = 100,
) => {
  const bitget = new BitGetFutures()
  const bybit = new ByBitFutures()

  const bitgetPrice = await bitget.getSimplePrice(rawSymbol)
  const bybitPrice = await bybit.getSimplePrice(rawSymbol)
  // TODO: make simpleNextFunding on both classes
  // const bitGetFunding = await bitget.getNextFunding(firstResult.baseCurrency)
  // const bybitFunding = await bybit.getSymbol(firstResult.baseCurrency)

  // bybit
  const orderPrice = medianPrice(bitgetPrice, bybitPrice)
  const spread = priceSpread(bitgetPrice, bybitPrice)
  const size = roundFloatTo2Decimals(value / Number(orderPrice))

  const bybitMatch = longMatch.platform === 'bybit' ? longMatch : shortMatch
  const bitgetMatch = longMatch.platform === 'bitget' ? longMatch : shortMatch

  const bybitSide: ByBitOrderSide = bybitMatch.receivingSide === FundingRateSide.Long ? 'Buy' : 'Sell'
  const bitgetSide: BitGetOrderSide = bitgetMatch.receivingSide === FundingRateSide.Long ? 'open_long' : 'open_short'

  console.log({
    orderPrice,
    spread,
  })

  const bybitOrder = await bybit.placeOrder(rawSymbol, bybitSide, orderPrice, size)
  const bitgetOrder = await bitget.placeOrder(rawSymbol, bitgetSide, orderPrice, size)

  return {
    bybit: bybitOrder,
    bitget: bitgetOrder,
  }
}

export const closeFundingOrder = async (rawSymbol: string, bybitOrderLinkId: string, bitgetOrderId: string) => {
  const bybit = new ByBitFutures()
  const bitget = new BitGetFutures()

  // create price
  const bitgetPrice = await bitget.getSimplePrice(rawSymbol)
  const bybitPrice = await bybit.getSimplePrice(rawSymbol)
  const orderPrice = medianPrice(bitgetPrice, bybitPrice)
  console.log({ orderPrice })

  // create close orders
  const byBitOrder = await bybit.closeOrder(rawSymbol, bybitOrderLinkId, orderPrice)
  const bitgetOrder = await bitget.closeOrder(rawSymbol, bitgetOrderId, orderPrice)

  console.log({ byBitOrder, bitgetOrder })
}
