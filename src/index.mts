import { BitGetFutures } from './bitget.mjs'
import { BitGetOrderSide } from './bitget/bitget.private.interfaces.mjs'
import { ByBitFutures } from './bybit.mjs'
import { ByBitOrderSide } from './bybit/bybit.private.interfaces.mjs'
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
  const bybit = new ByBitFutures()
  const bitget = new BitGetFutures()
  const orders = await bybit.getOrders('APT', { orderLinkId: '3aec8f3d6551537220afe8d255b2639f' })
  const bybitOrder = orders.list[0]
  console.log({ bybitOrder })

  // create price
  const bitgetPrice = await bitget.getSimplePrice('APT')
  const bybitPrice = await bybit.getSimplePrice('APT')
  const orderPrice = medianPrice(bitgetPrice, bybitPrice)
  console.log({ orderPrice })

  // create close orders
  const byBitSide: ByBitOrderSide = bybitOrder.side === 'Buy' ? 'Sell' : 'Buy'
  const byBitNextOrder = await bybit.placeOrder(
    'APT',
    byBitSide,
    orderPrice,
    bybitOrder.qty,
    true,
    bybitOrder.side as ByBitOrderSide,
  )

  console.log({ byBitNextOrder })
}

void main()
