import { mostProfitableSymbol } from './main.utils.mjs'

const main = async () => {
  // create close orders
  // await closeFundingOrder('IOTA', 'dabee348eca7daf9f93daa086962b1a7', '969181477796982785')
  const profitable = await mostProfitableSymbol()
  console.log(profitable)
}

void main()
