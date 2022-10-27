export interface CommonFundingRate {
  symbol: string
  apr: number
  receivingSide: FundingRateSide
  baseCurrency: string
}

export enum FundingRateSide {
  Long = 'long',
  Short = 'short',
}

export interface FundingRateWithPlatform extends CommonFundingRate {
  platform: string
}
export interface ContractOccurrence extends FundingRateWithPlatform {
  volume24h: string
  price: string
}

export interface ComputingFundingRate {
  baseCurrency: string
  resultingApr: number
  shortApr?: number
  longApr?: number
  longMatch?: FundingRateWithPlatform
  shortMatch?: FundingRateWithPlatform
  allMatches: FundingRateWithPlatform[]
}

export interface ResultingFundingRate extends ComputingFundingRate {
  priceSpread: string
  longMatch?: ContractOccurrence
  shortMatch?: ContractOccurrence
  allMatches: ContractOccurrence[]
}
