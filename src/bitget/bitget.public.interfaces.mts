export interface GenericBitGetResponse<T = unknown> {
  code: string // '00000'
  msg: string // 'success'
  requestTime: number
  data: T
}

export interface BitGetSymbol {
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

export interface BitGetTicker {
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

export interface BitGetNextFundingTime {
  symbol: string // Symbol ID
  fundingTime: string // Next settlement time, milliseconds
}

export interface BitGetHistoricFundingRate {
  symbol: string // Symbol name
  fundingRate: string // Current funding rate
  settleTime: string // Settlement time
}

export interface BitGetCurrentFundingRate {
  symbol: string // Symbol name
  fundingRate: string // Current funding rate
}

export interface BitGetMarkPrice {
  symbol: string // Symbol Id
  markPrice: string // Mark price
  timestamp: string // Timestamp (milliseconds)
}

export interface BitGetSymbolLeverage {
  symbol: string // symbol id
  minLeverage: string // min leverage
  maxLeverage: string // max leverage
}
