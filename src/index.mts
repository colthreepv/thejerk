import { BitGetFutures } from './bitget.mjs'
import { BitGetOrderSide } from './bitget/bitget.private.interfaces.mjs'
import { ByBitFutures } from './bybit.mjs'
import { ByBitOrderSide } from './bybit/bybit.private.interfaces.mjs'
import { closeFundingOrder } from './main.utils.mjs'
import { medianPrice } from './math.util.mjs'

const createOrder = async () => {
  const bybit = new ByBitFutures()
  const bitget = new BitGetFutures()

  // create price
  const bitgetPrice = await bitget.getSimplePrice('APT')
  const bybitPrice = await bybit.getSimplePrice('APT')
  const orderPrice = medianPrice(bitgetPrice, bybitPrice)
  console.log({ orderPrice })

  const byBitOrder = await bybit.placeOrder('APT', 'Buy', orderPrice, 1)
  return byBitOrder
}

const main = async () => {
  // create close orders
  // await closeFundingOrder('IOTA', 'dabee348eca7daf9f93daa086962b1a7', '969181477796982785')
}

void main()
