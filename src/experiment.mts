import {
  getCurrentFundingRate,
  getMarkPrice,
  getNextFunding,
  getSymbolLeverage,
  getSymbols,
  getTicker,
} from './bitget.mjs'

export const randomExperiment = async () => {
  const allSymbols = await getSymbols()

  const kavaSymbol = allSymbols.find((s) => s.baseCoin === 'KAVA')
  console.log({ kavaSymbol })

  // const btcDepth = await getDepth('BTCUSDT_UMCBL')
  const kavaTicker = await getTicker(kavaSymbol!.symbol)
  console.log({ kavaTicker })

  const [kavaNextFunding, kavaCurrentFunding, kavaMarkPrice, kavaLeverage] = await Promise.all([
    getNextFunding(kavaSymbol!.symbol),
    getCurrentFundingRate(kavaSymbol!.symbol),
    getMarkPrice(kavaSymbol!.symbol),
    getSymbolLeverage(kavaSymbol!.symbol),
  ])
  console.log({ kavaNextFunding, kavaCurrentFunding, kavaMarkPrice, kavaLeverage })
}
