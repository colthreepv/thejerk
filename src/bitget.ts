import got from 'got'

import { bitgetConfig } from './config'
import getSigner from './util.bitget'

interface GenericBitGetResponse<T = unknown> {
  code: string // '00000'
  msg: string // 'success'
  requestTime: number
  data: T[]
}

interface BitGetSymbol {
  symbol: string // 'BTTUSDT_SPBL',
  symbolName: string // 'BTTUSDT',
  baseCoin: string // 'BTT',
  quoteCoin: string // 'USDT',
  minTradeAmount: string // '1000',
  maxTradeAmount: string // '0',
  takerFeeRate: string // '0.001',
  makerFeeRate: string // '0.001',
  priceScale: string // '10',
  quantityScale: string // '0',
  status: string // 'online',
  minTradeUSDT: string // '5'
}

interface BitGetTicker {
  symbol: string // 'BTCUSDT',
  high24h: string // '19234.91',
  low24h: string // '18847.76',
  close: string // '19160.91',
  quoteVol: string // '126910785.7574',
  baseVol: string // '6641.6382',
  usdtVol: string // '126910785.757383',
  ts: string // '1665615862032',
  buyOne: string // '19160.18',
  sellOne: string // '19161.71',
  bidSz: string // '0.0848',
  askSz: string // '0.0817',
  openUtc0: string // '19058.2'
}

export const getSymbols = async () => {
  const response = await got('https://api.bitget.com/api/spot/v1/public/products').json<
    GenericBitGetResponse<BitGetSymbol>
  >()

  if (response.code !== '00000') throw new Error(response.msg)
  return response.data
}

export const getTicker = async (symbol: string) => {
  const response = await got('https://api.bitget.com/api/spot/v1/market/ticker', {
    searchParams: { symbol },
  }).json<GenericBitGetResponse<BitGetTicker>>()

  return response.data
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

  const response = await got('https://api.bitget.com/api/spot/v1/trade/orders', {
    method: 'POST',
    headers: signer('POST', url, body),
    json: body,
    responseType: 'json',
  })

  return response.body
}
