export interface ByBitOrderCreated {
  orderId: string // 'd5e8b5c9-2e5b-452b-b0f9-b7063ebce0d1'
  orderLinkId: string // '2ed8ad3860b5b28e60038db6564172bd'
}

export interface ByBitPosition {
  positionIdx: number // 1
  riskId: string // '1'
  symbol: string // 'APTUSDT'
  side: string // 'Buy'
  size: string // '0.00'
  positionValue: string // '0'
  entryPrice: string // '0'
  tradeMode: number // 0
  autoAddMargin: number // 0
  leverage: string // '10'
  positionBalance: string // '0'
  liqPrice: string // '0.000'
  bustPrice: string // '0.000'
  takeProfit: string // '0.000'
  stopLoss: string // '0.000'
  trailingStop: string // '0.000'
  unrealisedPnl: string // '0'
  createdTime: string // '1666745664851'
  updatedTime: string // '1666771200118'
  tpSlMode: string // 'Full'
  riskLimitValue: string // '200000'
  activePrice: string // '0.000'
}
export interface ByBitPositions {
  list: Array<ByBitPosition>
}

export interface ByBitOrder {
  symbol: string // 'APTUSDT'
  side: string // 'Sell'
  orderType: string // 'Limit'
  price: string // '8.720'
  qty: string // '11.47'
  reduceOnly: boolean // false
  timeInForce: string // 'GoodTillCancel'
  orderStatus: ByBitOrderStatus // 'Filled'
  leavesQty: string // '0.00'
  leavesValue: string // '0'
  cumExecQty: string // '11.47'
  cumExecValue: string // '100.0184'
  cumExecFee: string // '0.04226584'
  lastPriceOnCreated: string // '0.000'
  rejectReason: string // 'EC_NoError'
  orderLinkId: string // 'c285fb0177d0cbe40226c7c8d972c22b'
  createdTime: string // '1666745826967'
  updatedTime: string // '1666745828518'
  orderId: string // '8aff91cd-27b4-4ea3-88e4-7c95f51930b4'
  stopOrderType: string // 'UNKNOWN'
  takeProfit: string // '0.000'
  stopLoss: string // '0.000'
  tpTriggerBy: string // 'UNKNOWN'
  slTriggerBy: string // 'UNKNOWN'
  triggerPrice: string // '0.000'
  closeOnTrigger: boolean // false
  triggerDirection: number // 0
  positionIdx: number // 0
}
export interface ByBitOrders {
  list: Array<ByBitOrder>
}

export type ByBitOrderSide = 'Buy' | 'Sell'

export type ByBitOrderStatus =
  | 'Created' // order has been accepted by the system but not yet put through the matching engine
  | 'New' // order has been placed successfully
  | 'Rejected'
  | 'PartiallyFilled'
  | 'Filled'
  | 'PendingCancel' // matching engine has received the cancelation request but it may not be canceled successfully
  | 'Cancelled'
