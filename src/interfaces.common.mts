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
export interface ContractOccurrenceWithVolume extends ContractOccurrence {
  volume24h: string
  price: string
}

export interface ComputingFundingRate {
  baseCurrency: string
  resultingApr: number
  shortApr?: number
  longApr?: number
  longMatch?: ContractOccurrence
  shortMatch?: ContractOccurrence
  allMatches: ContractOccurrence[]
}

export interface ResultingFundingRate extends ComputingFundingRate {
  priceSpread: string
  longMatch?: ContractOccurrenceWithVolume
  shortMatch?: ContractOccurrenceWithVolume
  allMatches: ContractOccurrenceWithVolume[]
}
