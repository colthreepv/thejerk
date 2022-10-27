import { CommonFundingRate, ComputingFundingRate, ContractOccurrence, FundingRateSide } from './interfaces.common.mjs'

export const addFundingOccurrence = (
  result: ComputingFundingRate,
  fundingRate: CommonFundingRate,
  platform: string,
): ComputingFundingRate => {
  const nextResult = Object.assign({}, result)
  const occurrence: ContractOccurrence = Object.assign({}, fundingRate, { platform })

  if (occurrence.receivingSide === FundingRateSide.Long) {
    if (result.longApr === undefined || result.longApr < occurrence.apr) {
      nextResult.longApr = occurrence.apr
      nextResult.longMatch = occurrence
    }
  } else {
    if (result.shortApr === undefined || result.shortApr < occurrence.apr) {
      nextResult.shortApr = occurrence.apr
      nextResult.shortMatch = occurrence
    }
  }

  nextResult.resultingApr = (nextResult.longApr ?? 0) + (nextResult.shortApr ?? 0)
  nextResult.allMatches.push(occurrence)

  return nextResult
}
