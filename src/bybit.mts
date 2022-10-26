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
  symbol: string // 'KAVAUSDT',
  bid_price: string // '1.434',
  ask_price: string // '1.435',
  last_price: string // '1.435',
  last_tick_direction: string // 'MinusTick',
  prev_price_24h: string // '1.414',
  price_24h_pcnt: string // '0.014851',
  high_price_24h: string // '1.453',
  low_price_24h: string // '1.411',
  prev_price_1h: string // '1.431',
  mark_price: string // '1.435',
  index_price: string // '1.436',
  open_interest: number // 1295907.5,
  countdown_hour: number // 0,
  turnover_24h: string // '1877230.0364',
  volume_24h: number // 1309223.7,
  funding_rate: string // '-0.000566',
  predicted_funding_rate: string // '',
  next_funding_time: string // '2022-10-24T00:00:00Z',
  predicted_delivery_price: string // '',
  total_turnover: string // '',
  total_volume: number // 0,
  delivery_fee_rate: string // '',
  delivery_time: string // '',
  price_1h_pcnt: string // '',
  open_value: string // ''
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
      got(`${BYBIT_API_BASE}/v2/public/tickers`, {
        searchParams: { symbol },
      }).json<GenericByBitResponse<ByBitLatestSymbol[]>>(),
    )
    if (response.ret_code !== 0) throw new Error(response.ret_msg)
    if (response.result.length === 0) throw new Error(`Symbol ${symbol} not found`)
    if (response.result.length > 1) throw new Error(`multiple occurences for Symbol ${symbol} found`)

    return response.result[0]
  }

  async getCurrentFundingRate(rawSymbol: string, base_currency?: string) {
    const symbol = this.bybitSymbol(rawSymbol)
    const symbolData = await this.getSymbol(symbol)
    const { apr, receivingSide } = fundingtoApr(Number(symbolData.funding_rate))

    const returnValue: CommonFundingRate = {
      symbol: symbolData.symbol,
      apr,
      receivingSide,
      baseCurrency: base_currency || symbolData.symbol.slice(0, -4),
    }

    return returnValue
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
