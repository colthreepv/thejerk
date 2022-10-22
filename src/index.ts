import { setLeverage } from './bitget'

const main = async () => {
  const response = await setLeverage('KAVAUSDT_UMCBL', 10)
  console.log({ response })
}

void main()

export {}
