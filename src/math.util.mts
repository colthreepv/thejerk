import { FundingRateSide } from './interfaces.common.mjs'

const safePercentage = (numerator: number, denominator: number) => {
  return denominator === 0 ? 0 : roundFloatTo2Decimals(numerator / denominator)
}

// with EPSILON works more accurately on some numbers, https://stackoverflow.com/a/11832950/1071793
export const roundFloatTo2Decimals = (value: number) => {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export const fundingtoApr = (funding: number) => {
  const apr = funding * 3 * 365 * 100
  const receivingSide = apr > 0 ? FundingRateSide.Short : FundingRateSide.Long
  return { apr: Math.abs(roundFloatTo2Decimals(apr)), receivingSide }
}

export const medianPrice = (price0: string, price1: string): string => {
  const price0decimals = price0.split('.')[1].length
  const price1decimals = price1.split('.')[1].length
  const decimals = Math.min(price0decimals, price1decimals)

  const average = (Number(price0) + Number(price1)) / 2

  return average.toFixed(decimals)
}

export const priceSpread = (price0Str: string, price1Str: string): string => {
  const price0 = Number(price0Str)
  const price1 = Number(price1Str)
  const spread = Math.abs(price0 - price1)
  const median = medianPrice(price0Str, price1Str)

  // expressed in basis points
  const spreadBasis = (spread / Number(median)) * 10000

  return spreadBasis.toFixed(2)
}
