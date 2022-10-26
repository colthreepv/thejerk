import { createHmac, randomBytes, sign } from 'crypto'

export const getBybitPayload = (apiKey: string, secret: string, timestamp: string, payload: string) => {
  const recvWindow = 5000 // msec - anti replay-attack

  const signature = createHmac('sha256', secret)
    .update(timestamp + apiKey + recvWindow + payload)
    .digest('hex')

  return {
    signature,
    timestamp,
    recvWindow,
  }
}

export const getOrderLinkId = () => {
  return randomBytes(16).toString('hex')
}

export const getRequestHeaders = (apiKey: string, secretKey: string, payload: string, serverTime: string) => {
  const timestamp = new Date(Number(serverTime) * 1000).getTime().toString()
  const { signature, recvWindow } = getBybitPayload(apiKey, secretKey, timestamp, payload)

  return {
    'X-BAPI-SIGN-TYPE': '2',
    'X-BAPI-SIGN': signature,
    'X-BAPI-API-KEY': apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': String(recvWindow),
  }
}
