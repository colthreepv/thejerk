export type BitGetOrderSide = 'open_long' | 'open_short' | 'close_long' | 'close_short'
export type BitGetTypeInForce = 'normal' | 'post_only' | 'fok' | 'ioc'

export interface BitGetPlaceOrderResponse {
  clientOid: string // '968967718189019136'
  orderId: string // '968967718172241921'
}

export interface BitGetOrder {}
