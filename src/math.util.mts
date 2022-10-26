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
