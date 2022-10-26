import got from 'got'
import PQueue from 'p-queue'
import { bybitConfig } from './config.mjs'
import { CommonFundingRate } from './interfaces.common.mjs'
import { fundingtoApr } from './math.util.mjs'
import { getOrderLinkId, getRequestHeaders, getBybitPayload } from './util.bybit.mjs'

const BYBIT_API_BASE = 'https://api.bybit.com'

interface GenericByBitResponse<T = unknown> {
  ret_code: number // 0
  ret_msg: string // 'OK'
  result: T
  ext_code: string // ''
  ext_info: string // ''
  time_now: string // '1666541887.67488'
}

interface ByBitV3Response<T = unknown> {
  retCode: number // 0
  retMsg: string // 'OK'
  result: T
  retExtInfo: unknown // {}
  time: number // 1666743393174
}

interface ByBitSymbol {
  name: string // '10000NFTUSDT',
  alias: string // '10000NFTUSDT',
  status: string // 'Trading',
  base_currency: string // '10000NFT',
  quote_currency: string // 'USDT',
  price_scale: number // 6, Price scale (the number of decimal places to which a price can be submitted, although the final price may be rounded to conform to the tick_size)
  taker_fee: string // '0.0006',
  maker_fee: string // '0.0001',
  funding_interval: number // 480,
  leverage_filter: {
    min_leverage: number // 1,
    max_leverage: number // 12,
    leverage_step: string // '0.01'
  }
  price_filter: {
    min_price: string // '0.000005',
    max_price: string // '9.999990',
    tick_size: string // '0.000005'
  }
  lot_size_filter: {
    max_trading_qty: number // 250000,
    min_trading_qty: number // 10,
    qty_step: number // 10,
    post_only_max_trading_qty: string // '1250000'
  }
}

interface ByBitLatestSymbol {
  list: Array<{
    symbol: string // 'BTCUSDT'
    bidPrice: string // '19255'
    askPrice: string // '19255.5'
    lastPrice: string // '19255.50'
    lastTickDirection: string // 'ZeroPlusTick'
    prevPrice24h: string // '18634.50'
    price24hPcnt: string // '0.033325'
    highPrice24h: string // '19675.00'
    lowPrice24h: string // '18610.00'
    prevPrice1h: string // '19278.00'
    markPrice: string // '19255.00'
    indexPrice: string // '19260.68'
    openInterest: string // '48069.549'
    turnover24h: string // '4686694853.047006'
    volume24h: string // '243730.252'
    fundingRate: string // '0.0001'
    nextFundingTime: string // '1663689600000'
    predictedDeliveryPrice: string // ''
    basisRate: string // ''
    deliveryFeeRate: string // ''
    deliveryTime: string // '0'
  }>
}

interface ByBitOrderCreated {
  orderId: string // 'd5e8b5c9-2e5b-452b-b0f9-b7063ebce0d1'
  orderLinkId: string // '2ed8ad3860b5b28e60038db6564172bd'
}

export type ByBitOrderSide = 'Buy' | 'Sell'

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

  async placeOrder(rawSymbol: string, side: ByBitOrderSide, price: string | number, size: string | number) {
    const { apiKey, secretKey } = bybitConfig
    const symbol = this.bybitSymbol(rawSymbol)
    const orderLinkId = getOrderLinkId()

    const payload = {
      symbol,
      orderType: 'Limit',
      side,
      orderLinkId,
      positionIdx: side === 'Buy' ? 1 : 2,
      qty: String(size),
      price: String(price),
    }

    const serverTime = await this.getServerTime()

    const response = await this.queue.add(() =>
      got(`${BYBIT_API_BASE}/contract/v3/private/order/create`, {
        method: 'POST',
        headers: getRequestHeaders(apiKey, secretKey, payload, serverTime.timeSecond),
        json: payload,
        responseType: 'json',
        throwHttpErrors: false,
      }).json<ByBitV3Response<ByBitOrderCreated>>(),
    )

    return response.result
  }
}
