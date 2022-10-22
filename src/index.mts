import PQueue from 'p-queue'
import { getCurrentFundingRate, getSymbols, placeOrder, setLeverage } from './bitget.mjs'

const mostProfitableSymbol = async () => {
  const queue = new PQueue({ intervalCap: 20, interval: 1000 })
  const allSymbols = await queue.add(() => getSymbols())

  // get all funding rates
  console.log(`querying ${allSymbols.length} funding rates...`)
  const fundingRates = await queue.addAll(allSymbols.map((s) => () => getCurrentFundingRate(s.symbol)))

  const sortedFundingRates = fundingRates.sort((a, b) => b.apr - a.apr).filter((_, idx) => idx < 10)

  console.log({
    sortedFundingRates,
  })
}

const main = async () => {
  // const response = await setLeverage('KAVAUSDT_UMCBL', 1)
  // console.log({ response })

  // const order = await placeOrder('KAVAUSDT_UMCBL', 'open_long', 1, 5)
  // console.log({ order })
  await mostProfitableSymbol()
}

void main()

export {}
