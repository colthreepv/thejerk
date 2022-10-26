import got from 'got'
import PQueue from 'p-queue'
import { BitGetOrderSide, BitGetPlaceOrderResponse, BitGetTypeInForce } from './bitget/bitget.private.interfaces.mjs'
import {
  BitGetCurrentFundingRate,
  BitGetHistoricFundingRate,
  BitGetMarkPrice,
  BitGetNextFundingTime,
  BitGetSymbol,
  BitGetSymbolLeverage,
  BitGetTicker,
  GenericBitGetResponse,
} from './bitget/bitget.public.interfaces.mjs'

import { bitgetConfig } from './config.mjs'
import { CommonFundingRate } from './interfaces.common.mjs'
import { fundingtoApr } from './math.util.mjs'
import getSigner from './util.bitget.mjs'

const BITGET_API_BASE = 'https://api.bitget.com'

export class BitGetFutures {
  queue = new PQueue({ intervalCap: 20, interval: 1000 })

  bitgetSymbol(symbol: string) {
    return symbol.endsWith('USDT_UMCBL') ? symbol : `${symbol}USDT_UMCBL`
  }

  async getSymbols() {
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/contracts`, {
        searchParams: {
          productType: 'umcbl',
        },
      }).json<GenericBitGetResponse<BitGetSymbol[]>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    // filter niche derivates
    const filteredSymbols = response.data
      .filter((symbol) => !symbol.baseCoin.includes('1000'))
      .filter((symbol) => symbol.quoteCoin === 'USDT')

    return filteredSymbols
  }

  // kind of useless, it returns the list of bid/asks
  async getDepth(rawSymbol: string, limit: '5' | '15' | '50' | '100' = '100') {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/depth`, {
        searchParams: { symbol, limit },
      }).json<GenericBitGetResponse>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    return response.data
  }

  async getTicker(rawSymbol: string) {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/ticker`, {
        searchParams: { symbol },
      }).json<GenericBitGetResponse<BitGetTicker>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    return response.data
  }

  async getNextFunding(rawSymbol: string) {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/funding-time`, {
        searchParams: { symbol },
      }).json<GenericBitGetResponse<BitGetNextFundingTime>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    const returnValue = {
      symbol: response.data.symbol,
      fundingTime: new Date(Number(response.data.fundingTime)),
    }

    return returnValue
  }

  async getHistoryFundingRate(rawSymbol: string) {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/history-fundRate`, {
        searchParams: { symbol },
      }).json<GenericBitGetResponse<BitGetHistoricFundingRate[]>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    const returnValue = response.data.map((item) => {
      const { apr, receivingSide } = fundingtoApr(Number(item.fundingRate))

      return {
        symbol: item.symbol,
        apr,
        receivingSide,
        settleTime: new Date(Number(item.settleTime)),
      }
    })

    return returnValue
  }

  async getCurrentFundingRate(rawSymbol: string, baseCurrency?: string) {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/current-fundRate`, {
        searchParams: { symbol },
      }).json<GenericBitGetResponse<BitGetCurrentFundingRate>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    const { apr, receivingSide } = fundingtoApr(Number(response.data.fundingRate))

    const returnValue: CommonFundingRate = {
      symbol: response.data.symbol,
      apr,
      receivingSide,
      baseCurrency: baseCurrency || response.data.symbol.slice(0, -10),
    }

    return returnValue
  }

  async getMarkPrice(rawSymbol: string) {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/mark-price`, {
        searchParams: { symbol },
      }).json<GenericBitGetResponse<BitGetMarkPrice>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    const returnValue = {
      symbol: response.data.symbol,
      markPrice: Number(response.data.markPrice),
      timestamp: new Date(Number(response.data.timestamp)),
    }

    return returnValue
  }

  async getSymbolLeverage(rawSymbol: string) {
    const symbol = this.bitgetSymbol(rawSymbol)
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/market/symbol-leverage`, {
        searchParams: { symbol },
      }).json<GenericBitGetResponse<BitGetSymbolLeverage>>(),
    )
    if (response.code !== '00000') throw new Error(response.msg)

    const returnValue = {
      symbol: response.data.symbol,
      minLeverage: Number(response.data.minLeverage),
      maxLeverage: Number(response.data.maxLeverage),
    }

    return returnValue
  }

  async getSimplePrice(rawSymbol: string): Promise<string> {
    const data = await this.getMarkPrice(rawSymbol)

    return String(data.markPrice)
  }

  async setLeverage(rawSymbol: string, leverage: number, marginCoin: string = 'USDT') {
    const { apiKey, secretKey, passPhrase } = bitgetConfig
    const signer = getSigner(apiKey, secretKey, passPhrase)
    const url = '/api/mix/v1/account/setLeverage'
    const symbol = this.bitgetSymbol(rawSymbol)
    const body = {
      symbol, // Symbol Id (Must be capitalized)
      marginCoin, // Margin currency (Must be capitalized)
      leverage, // Leverage
    }
    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/account/setLeverage`, {
        method: 'POST',
        headers: signer('POST', url, body),
        json: body,
        responseType: 'json',
      }),
    )

    return response.body
  }

  /**
   * Note on prices
   * The price and quantity of the order need to meet pricePlace and priceEndStep volumePlace, those fields
   * could be found from the response of Market -> Get All Symbols
   *
   * for example:
   * pricePlace of BTCUSDT_UMCBL is 1 and priceEndStep is 5, then the order price needs to satisfy a multiple of 0.5,
   * for example, the price should be 23455.0, 23455.5, 23446.0
   *
   * pricePlace of ETHUSDT_UMCBL is 2 and priceEndStep is 1, then the order price needs to satisfy a multiple of 0.01,
   * for example, the price should be 1325.00, 1325.01, 1325.02
   */
  async placeOrder(
    rawSymbol: string,
    side: BitGetOrderSide,
    price: string | number,
    size: string | number,
    type: BitGetTypeInForce = 'normal',
  ) {
    const { apiKey, secretKey, passPhrase } = bitgetConfig
    const signer = getSigner(apiKey, secretKey, passPhrase)
    const url = '/api/mix/v1/order/placeOrder'

    const marginCoin = 'USDT'
    const orderType = 'limit'

    // TODO: generate idempotent id based on parameters
    const symbol = this.bitgetSymbol(rawSymbol)
    const body = {
      symbol, // Symbol Id
      marginCoin, // Margin currency
      size: String(size), // Order quantity
      price: String(price), // Order price
      side, // Order direction
      orderType, // Order type
      timeInForceValue: type, // Time in force
      // clientOid | Unique client order ID, The idempotent is promised but only within 24 hours
    }

    const response = await this.queue.add(() =>
      got(`${BITGET_API_BASE}/api/mix/v1/order/placeOrder`, {
        method: 'POST',
        headers: signer('POST', url, body),
        json: body,
        responseType: 'json',
        throwHttpErrors: false,
      }).json<GenericBitGetResponse<BitGetPlaceOrderResponse>>(),
    )

    return response.data
  }
}
