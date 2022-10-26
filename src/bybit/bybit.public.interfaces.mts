export interface GenericByBitResponse<T = unknown> {
  ret_code: number // 0
  ret_msg: string // 'OK'
  result: T
  ext_code: string // ''
  ext_info: string // ''
  time_now: string // '1666541887.67488'
}

export interface ByBitV3Response<T = unknown> {
  retCode: number // 0
  retMsg: string // 'OK'
  result: T
  retExtInfo: unknown // {}
  time: number // 1666743393174
}

export interface ByBitSymbol {
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

export interface ByBitLatestSymbol {
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
