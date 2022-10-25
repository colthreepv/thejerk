import { BitGetFutures } from './bitget.mjs'

import { ByBitFutures } from './bybit.mjs'
import { addFundingOccurrence } from './funding.util.mjs'
import { ResultingFundingRate } from './interfaces.common.mjs'

const BitGetMostProfitableSymbol = async () => {
  const bitget = new BitGetFutures()
  const allSymbols = await bitget.getSymbols()

  // get all funding rates
  console.log(`querying ${allSymbols.length} funding rates...`)
  const fundingRates = await Promise.all(allSymbols.map((s) => bitget.getCurrentFundingRate(s.symbol)))

  const sortedFundingRates = fundingRates.sort((a, b) => b.apr - a.apr)

  return sortedFundingRates
}

const ByBitMostProfitableSymbol = async () => {
  const bybit = new ByBitFutures()
  const allSymbols = await bybit.getSymbols()

  // get all funding rates
  console.log(`querying ${allSymbols.length} funding rates...`)
  const fundingRates = await Promise.all(allSymbols.map((s) => bybit.getCurrentFundingRate(s.name)))

  const sortedFundingRates = fundingRates.sort((a, b) => b.apr - a.apr)

  return sortedFundingRates
}

const mostProfitableSymbol = async () => {
  const [bybitProfitable, bitgetProfitable] = await Promise.all([
    ByBitMostProfitableSymbol(),
    BitGetMostProfitableSymbol(),
  ])

  const fundingMap = new Map<string, ResultingFundingRate>()
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

  const result = Array.from(fundingMap.values())
    .filter((value) => value.longApr !== undefined && value.shortApr !== undefined)
    .sort((a, b) => b.resultingApr - a.resultingApr)
    .filter((_, idx) => idx < 10)

  return result
}

const main = async () => {
  const bitget = new BitGetFutures()
  const bybit = new ByBitFutures()

  const result = await mostProfitableSymbol()
  const firstResult = result[0]

  const bitgetPrice = await bitget.getMarkPrice(firstResult.baseCurrency)
  const bitGetFunding = await bitget.getNextFunding(firstResult.baseCurrency)
  const bybitFunding = await bybit.getSymbol(firstResult.baseCurrency)

  console.log({
    bitgetPrice,
    bybitPrice: bybitFunding.mark_price,
    bitget: bitGetFunding,
    bybit: bybitFunding,
  })
}

void main()
