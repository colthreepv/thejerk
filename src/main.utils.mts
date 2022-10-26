import { BitGetFutures } from './bitget.mjs'
import { BitGetOrderSide } from './bitget/bitget.private.interfaces.mjs'

import { ByBitFutures } from './bybit.mjs'
import { ByBitOrderSide } from './bybit/bybit.private.interfaces.mjs'
import { addFundingOccurrence } from './funding.util.mjs'
import { FundingRateSide, ResultingFundingRate } from './interfaces.common.mjs'
import { medianPrice, roundFloatTo2Decimals } from './math.util.mjs'

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

export const mostProfitableSymbol = async () => {
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

export const createFundingOrder = async () => {
  const bitget = new BitGetFutures()
  const bybit = new ByBitFutures()

  const result = await mostProfitableSymbol()
  const firstResult = result[0]

  const bitgetPrice = await bitget.getSimplePrice(firstResult.baseCurrency)
  const bybitPrice = await bybit.getSimplePrice(firstResult.baseCurrency)
  // TODO: make simpleNextFunding on both classes
  // const bitGetFunding = await bitget.getNextFunding(firstResult.baseCurrency)
  // const bybitFunding = await bybit.getSymbol(firstResult.baseCurrency)

  console.log({
    bestResult: firstResult,
    bitgetPrice,
    bybitPrice,
  })

  // bybit
  const orderPrice = medianPrice(bitgetPrice, bybitPrice)
  const overallValue = 100 // usdt
  const size = roundFloatTo2Decimals(overallValue / Number(orderPrice))

  const bybitSide: ByBitOrderSide =
    firstResult.allMatches.find((m) => m.platform === 'bybit')?.receivingSide === FundingRateSide.Long ? 'Buy' : 'Sell'

  const bitgetSide: BitGetOrderSide =
    firstResult.allMatches.find((m) => m.platform === 'bitget')?.receivingSide === FundingRateSide.Long
      ? 'open_long'
      : 'open_short'

  console.log({
    orderPrice,
  })
  const bybitOrder = await bybit.placeOrder(firstResult.baseCurrency, bybitSide, orderPrice, size)
  const bitgetOrder = await bitget.placeOrder(firstResult.baseCurrency, bitgetSide, orderPrice, size)

  console.log({
    bybitOrder,
    bitgetOrder,
  })
}

export const closeFundingOrder = async (bybitOrderLinkId: string, bitgetOrderId: string) => {
  const bybit = new ByBitFutures()
  const bitget = new BitGetFutures()
  const orders = await bybit.getOrders('APT', { orderLinkId: bybitOrderLinkId })
  const bybitOrder = orders.list[0]

  const bitgetOrder = await bitget.getOrder('APT', { orderId: bitgetOrderId })
  console.log({ bybitOrder, bitgetOrder })

  // create price
  const bitgetPrice = await bitget.getSimplePrice('APT')
  const bybitPrice = await bybit.getSimplePrice('APT')
  const orderPrice = medianPrice(bitgetPrice, bybitPrice)
  console.log({ orderPrice })

  // create close orders
  const byBitSide: ByBitOrderSide = bybitOrder.side === 'Buy' ? 'Sell' : 'Buy'
  const byBitNextOrder = await bybit.placeOrder('APT', byBitSide, orderPrice, bybitOrder.qty)
  const bitgetSide: BitGetOrderSide = bitgetOrder.side === 'open_long' ? 'close_long' : 'close_short'
  const bitgetNextOrder = await bitget.placeOrder('APT', bitgetSide, orderPrice, bitgetOrder.size)

  console.log({ byBitNextOrder, bitgetNextOrder })
}
