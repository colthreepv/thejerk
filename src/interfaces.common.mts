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

export interface ContractOccurrence extends CommonFundingRate {
  platform: string
}

export interface ResultingFundingRate {
  baseCurrency: string
  resultingApr: number
  shortApr?: number
  longApr?: number
  longMatch?: ContractOccurrence
  shortMatch?: ContractOccurrence
  allMatches: ContractOccurrence[]
}
