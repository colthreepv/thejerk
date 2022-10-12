import { getSymbols, getTicker } from './bitget'

const main = async () => {
  console.log('hello world')
  const allSymbols = await getSymbols()
  const symbolsMap = allSymbols.reduce<Record<string, typeof allSymbols[0]>>((hash, symbol) => {
    hash[symbol.symbol] = symbol
    return hash
  }, {})
  console.log(symbolsMap.ETHUSDT_SPBL)

  const ticker = await getTicker('ETHUSDT_SPBL')
  console.log({ ticker })

  // const orderValue = 7
  // const orderPrice = 1200
  // const orderQuantity = orderValue / orderPrice
  // await placeOrder('ETHUSDT_SPBL', 'buy', orderPrice.toString(), orderQuantity.toFixed(4))
}

void main()

export {}
