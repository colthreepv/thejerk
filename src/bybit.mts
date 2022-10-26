import got from 'got'
import PQueue from 'p-queue'
import { ByBitOrderCreated, ByBitOrders, ByBitOrderSide, ByBitPositions } from './bybit/bybit.private.interfaces.mjs'
import {
  ByBitLatestSymbol,
  ByBitSymbol,
  ByBitV3Response,
  GenericByBitResponse,
} from './bybit/bybit.public.interfaces.mjs'
import { bybitConfig } from './config.mjs'
import { CommonFundingRate } from './interfaces.common.mjs'
import { fundingtoApr } from './math.util.mjs'
import { getOrderLinkId, getRequestHeaders } from './util.bybit.mjs'

const BYBIT_API_BASE = 'https://api.bybit.com'

export class ByBitFutures {
  queue = new PQueue({ intervalCap: 50, interval: 1000 })

  bybitSymbol(symbol: string) {
    return symbol.endsWith('USDT') ? symbol : `${symbol}USDT`
  }

  async getSymbols() {
    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/v2/public/symbols`).json<GenericByBitResponse<ByBitSymbol[]>>(),
    )
    if (response.ret_code !== 0) throw new Error(response.ret_msg)

    // filter niche derivates
    const filteredSymbols = response.result
      .filter((symbol) => !symbol.base_currency.includes('1000'))
      .filter((symbol) => symbol.quote_currency === 'USDT')
    return filteredSymbols
  }

  async getSymbol(rawSymbol: string) {
    const symbol = this.bybitSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/derivatives/v3/public/tickers`, {
        searchParams: { symbol, category: 'linear' },
      }).json<ByBitV3Response<ByBitLatestSymbol>>(),
    )
    if (response.retCode !== 0) throw new Error(response.retMsg)
    if (response.result.list.length === 0) throw new Error(`Symbol ${symbol} not found`)
    if (response.result.list.length > 1) throw new Error(`multiple occurences for Symbol ${symbol} found`)

    return response.result.list[0]
  }

  async getCurrentFundingRate(rawSymbol: string, base_currency?: string) {
    const symbol = this.bybitSymbol(rawSymbol)
    const symbolData = await this.getSymbol(symbol)
    const { apr, receivingSide } = fundingtoApr(Number(symbolData.fundingRate))

    const returnValue: CommonFundingRate = {
      symbol: symbolData.symbol,
      apr,
      receivingSide,
      baseCurrency: base_currency || symbolData.symbol.slice(0, -4),
    }

    return returnValue
  }

  async getSimplePrice(rawSymbol: string): Promise<string> {
    const data = await this.getSymbol(rawSymbol)

    return String(data.markPrice)
  }

  async getServerTime() {
    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/v3/public/time`).json<ByBitV3Response<{ timeSecond: string; timeNano: string }>>(),
    )
    if (response.retCode !== 0) throw new Error(response.retMsg)

    return response.result
  }

  async placeOrder(
    rawSymbol: string,
    side: ByBitOrderSide,
    price: string | number,
    size: string | number,
    reduceOnly = false,
    forcedPosition?: ByBitOrderSide,
  ) {
    const { apiKey, secretKey } = bybitConfig
    const symbol = this.bybitSymbol(rawSymbol)
    const orderLinkId = getOrderLinkId()

    const positionIdx = forcedPosition ? (forcedPosition === 'Buy' ? 1 : 2) : side === 'Buy' ? 1 : 2

    const payload = {
      symbol,
      orderType: 'Limit',
      side,
      orderLinkId,
      positionIdx,
      qty: String(size),
      price: String(price),
      reduceOnly,
    }

    const serverTime = await this.getServerTime()
    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/contract/v3/private/order/create`, {
        method: 'POST',
        headers: getRequestHeaders(apiKey, secretKey, JSON.stringify(payload), serverTime.timeSecond),
        json: payload,
        responseType: 'json',
        throwHttpErrors: false,
      }).json<ByBitV3Response<ByBitOrderCreated>>(),
    )

    return response
  }

  async closeOrder(rawSymbol: string, orderLinkId: string, price: string) {
    const symbol = this.bybitSymbol(rawSymbol)
    const orders = await this.getOrders(symbol, { orderLinkId })
    if (orders.list.length === 0) throw new Error(`No order with orderLinkId ${orderLinkId} found`)

    const bybitOrder = orders.list[0]
    const byBitClosingSide: ByBitOrderSide = bybitOrder.side === 'Buy' ? 'Sell' : 'Buy'
    return await this.placeOrder(
      symbol,
      byBitClosingSide,
      price,
      bybitOrder.qty,
      true,
      bybitOrder.side as ByBitOrderSide,
    )
  }

  // not really useful
  async getPositions(rawSymbol?: string) {
    const symbol = rawSymbol ? this.bybitSymbol(rawSymbol) : undefined
    const { apiKey, secretKey } = bybitConfig

    const searchParams: any = {}
    if (symbol) searchParams['symbol'] = symbol
    const urlParams = new URLSearchParams(searchParams)

    const serverTime = await this.getServerTime()
    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/contract/v3/private/position/list`, {
        searchParams,
        headers: getRequestHeaders(apiKey, secretKey, urlParams.toString(), serverTime.timeSecond),
        responseType: 'json',
        throwHttpErrors: false,
      }).json<ByBitV3Response<ByBitPositions>>(),
    )

    return response.result
  }

  async getOrders(rawSymbol?: string, { orderId, orderLinkId }: { orderId?: string; orderLinkId?: string } = {}) {
    const symbol = rawSymbol ? this.bybitSymbol(rawSymbol) : undefined
    const { apiKey, secretKey } = bybitConfig

    const searchParams: any = {}
    if (symbol) searchParams['symbol'] = symbol
    if (orderId) searchParams['orderId'] = orderId
    if (orderLinkId) searchParams['orderLinkId'] = orderLinkId
    const urlParams = new URLSearchParams(searchParams)

    const serverTime = await this.getServerTime()
    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/contract/v3/private/order/list`, {
        searchParams,
        headers: getRequestHeaders(apiKey, secretKey, urlParams.toString(), serverTime.timeSecond),
        responseType: 'json',
        throwHttpErrors: false,
      }).json<ByBitV3Response<ByBitOrders>>(),
    )

    return response.result
  }
}
