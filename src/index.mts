import { placeOrder, setLeverage } from './bitget.mjs'

const main = async () => {
  const response = await setLeverage('KAVAUSDT_UMCBL', 1)
  console.log({ response })

  // const order = await placeOrder('KAVAUSDT_UMCBL', 'open_long', 1, 5)
  // console.log({ order })
}

void main()

export {}
