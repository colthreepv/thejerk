export type BitGetOrderSide = 'open_long' | 'open_short' | 'close_long' | 'close_short'
export type BitGetTypeInForce = 'normal' | 'post_only' | 'fok' | 'ioc'

export interface BitGetPlaceOrderResponse {
  clientOid: string // '968967718189019136'
  orderId: string // '968967718172241921'
}

export interface BitGetOrder {
  symbol: string // 'APTUSDT_UMCBL'
  size: number // 11.47
  orderId: string // '968967718172241921'
  clientOid: string // '968967718189019136'
  filledQty: number // 11.47
  fee: number // -0.06000415
  price: number // 8.72
  priceAvg: number // 8.719
  state: string // 'filled'
  side: string // 'open_long'
  timeInForce: string // 'normal'
  totalProfits: number // 0
  posSide: string // 'long'
  marginCoin: string // 'USDT'
  filledAmount: number // 100.0069
  orderType: string // 'limit'
  leverage: string // '10'
  marginMode: string // 'crossed'
  cTime: string // '1666745827242'
  uTime: string // '1666745827351'
}
