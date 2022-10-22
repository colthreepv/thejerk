import got from 'got'

import { bitgetConfig } from './config'
import { fundingtoApr } from './math.util'
import getSigner from './util.bitget'

interface GenericBitGetResponse<T = unknown> {
  code: string // '00000'
  msg: string // 'success'
  requestTime: number
  data: T
}

interface BitGetSymbol {
  symbol: string // 'JASMYUSDT_UMCBL'        | Symbol Id, BTCUSDT_UMCBL
  makerFeeRate: string // '0.0002'           | Base currency, BTC
  takerFeeRate: string // '0.0006'           | Quote currency, USDT
  feeRateUpRatio: string // '0.005'          | Buy price limit ratio, 0.02 means 2%
  openCostUpRatio: string // '0.01'          | Sell price limit ratio, 0.01 means 1%
  quoteCoin: string // 'USDT'                | Rate of increase in handling fee, 0.005 means 0.5%
  baseCoin: string // 'JASMY'                | Maker fee rate, 0.0002 means 0.02%
  buyLimitPriceRatio: string // '0.02'       | Taker fee rate, 0.0006 means 0.06%
  sellLimitPriceRatio: string // '0.02'      | Percentage of increase in opening cost, 0.01 means 1%
  supportMarginCoins: string[] // [ 'USDT' ] | Support margin currency array
  minTradeNum: string // '1'                 | Minimum number of openings(Base Currency)
  priceEndStep: string // '1'                | Price step, i.e. when pricePlace=1, priceEndStep=5 means the price would only accept numbers like 10.0, 10.5, and reject numbers like 10.2(10.2 divided by 0.5 not equals to 0)
  volumePlace: string // '0'                 | Number of decimal places
  pricePlace: string // '6'                  | Price scale precision, i.e. 1 means 0.1; 2 means 0.01
  sizeMultiplier: string // '1'              | Quantity Multiplier The order size must be greater than minTradeNum and satisfy the multiple of sizeMultiplier
}

interface BitGetTicker {
  symbol: string // 'KAVAUSDT_UMCBL'       | Symbol Id
  last: string // '1.415'                  | Latest price
  bestAsk: string // '1.415'               | Ask1 price
  bestBid: string // '1.412'               | Bid1 price
  high24h: string // '1.447'               | Highest price in 24 hours
  low24h: string // '1.394'                | Lowest price in 24 hours
  timestamp: string // '1666457384068'     | Timestamp (milliseconds)
  priceChangePercent: string // '-0.00422' | Price change (24 hours)
  baseVolume: string // '891501.3'         | Base currency trading volume
  quoteVolume: string // '1270066.4296'    | Quote currency trading volume
  usdtVolume: string // '1270066.4296'     | USDT transaction volume
  openUtc: string // '1.41'                | UTC0 open price
  chgUtc: string // '0.00355'              | UTC0 price change(24 hour)
}

interface BitGetNextFundingTime {
  symbol: string // Symbol ID
  fundingTime: string // Next settlement time, milliseconds
}

interface BitGetHistoricFundingRate {
  symbol: string // Symbol name
  fundingRate: string // Current funding rate
  settleTime: string // Settlement time
}

interface BitGetCurrentFundingRate {
  symbol: string // Symbol name
  fundingRate: string // Current funding rate
}

interface BitGetMarkPrice {
  symbol: string // Symbol Id
  markPrice: string // Mark price
  timestamp: string // Timestamp (milliseconds)
}

interface BitGetSymbolLeverage {
  symbol: string // symbol id
  minLeverage: string // min leverage
  maxLeverage: string // max leverage
}

const BITGET_API_BASE = 'https://api.bitget.com'

export const getSymbols = async () => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/contracts`, {
    searchParams: {
      productType: 'umcbl',
    },
  }).json<GenericBitGetResponse<BitGetSymbol[]>>()
  if (response.code !== '00000') throw new Error(response.msg)

  return response.data
}

// kind of useless, it returns the list of bid/asks
export const getDepth = async (symbol: string, limit: '5' | '15' | '50' | '100' = '100') => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/depth`, {
    searchParams: { symbol, limit },
  }).json<GenericBitGetResponse>()
  if (response.code !== '00000') throw new Error(response.msg)

  return response.data
}

export const getTicker = async (symbol: string) => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/ticker`, {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetTicker>>()
  if (response.code !== '00000') throw new Error(response.msg)

  return response.data
}

export const getNextFunding = async (symbol: string) => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/funding-time`, {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetNextFundingTime>>()
  if (response.code !== '00000') throw new Error(response.msg)

  const returnValue = {
    symbol: response.data.symbol,
    fundingTime: new Date(Number(response.data.fundingTime)),
  }

  return returnValue
}

export const getHistoryFundingRate = async (symbol: string) => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/history-fundRate`, {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetHistoricFundingRate[]>>()
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

export const getCurrentFundingRate = async (symbol: string) => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/current-fundRate`, {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetCurrentFundingRate>>()
  if (response.code !== '00000') throw new Error(response.msg)

  const { apr, receivingSide } = fundingtoApr(Number(response.data.fundingRate))

  const returnValue = {
    symbol: response.data.symbol,
    apr,
    receivingSide,
  }

  return returnValue
}

export const getMarkPrice = async (symbol: string) => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/mark-price`, {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetMarkPrice>>()
  if (response.code !== '00000') throw new Error(response.msg)

  const returnValue = {
    symbol: response.data.symbol,
    markPrice: Number(response.data.markPrice),
    timestamp: new Date(Number(response.data.timestamp)),
  }

  return returnValue
}

export const getSymbolLeverage = async (symbol: string) => {
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/market/symbol-leverage`, {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetSymbolLeverage>>()
  if (response.code !== '00000') throw new Error(response.msg)

  const returnValue = {
    symbol: response.data.symbol,
    minLeverage: Number(response.data.minLeverage),
    maxLeverage: Number(response.data.maxLeverage),
  }

  return returnValue
}

export const setLeverage = async (symbol: string, leverage: number, marginCoin: string = 'USDT') => {
  const { apiKey, secretKey, passPhrase } = bitgetConfig
  const signer = getSigner(apiKey, secretKey, passPhrase)
  const url = '/api/mix/v1/account/setLeverage'
  const body = {
    symbol, // Symbol Id (Must be capitalized)
    marginCoin, // Margin currency (Must be capitalized)
    leverage, // Leverage
  }
  const response = await got(`${BITGET_API_BASE}/api/mix/v1/account/setLeverage`, {
    method: 'POST',
    headers: signer('POST', url, body),
    json: body,
    responseType: 'json',
  })

  return response.body
}

export const placeOrder = async (symbol: string, side: 'buy' | 'sell', price: string, quantity: string) => {
  const { apiKey, secretKey, passPhrase } = bitgetConfig
  const signer = getSigner(apiKey, secretKey, passPhrase)
  const url = '/api/spot/v1/trade/orders'
  const body = {
    symbol,
    side,
    orderType: 'limit',
    force: 'normal',
    price,
    quantity,
  }

  const response = await got(`${BITGET_API_BASE}/api/spot/v1/trade/orders`, {
    method: 'POST',
    headers: signer('POST', url, body),
    json: body,
    responseType: 'json',
  })

  return response.body
}
