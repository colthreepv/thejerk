import { config as dotEnvConfig } from 'dotenv'

const criticalException = (reason: string) => (context: any) => {
  if (context instanceof Error) console.error('Critical Exception occurred:', context.message)
  else console.error('Critical Exception occurred:', reason)
  console.error(context)
  process.exit(5)
}

const missingRequiredVariable = criticalException('Missing Required Variable')

export type APP_ENV = 'development' | 'production' | 'test'

export const ENV =
  process.env.NODE_ENV === 'production' ? 'production' : ((process.env.NODE_ENV ?? 'development') as APP_ENV)
// uso di file .env **solo** in sviluppo
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (ENV !== 'production') dotEnvConfig({ path: `.env.${ENV}` })

const confBuilder = <K extends string>(vars: readonly K[]) => {
  return vars.reduce((result, v) => {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    if (process.env[v] === undefined) throw missingRequiredVariable(v)
    result[v] = process.env[v] as string
    return result
    // eslint-disable-next-line
  }, {} as Record<K, string>)
}

// bitget
interface BitGetConfig {
  apiKey: string
  secretKey: string
  passPhrase: string
}
const { BITGET_APIKEY, BITGET_SECRETKEY, BITGET_PASSPHRASE } = confBuilder([
  'BITGET_APIKEY',
  'BITGET_SECRETKEY',
  'BITGET_PASSPHRASE',
])
const bitgetConfig: BitGetConfig = {
  apiKey: BITGET_APIKEY,
  secretKey: BITGET_SECRETKEY,
  passPhrase: BITGET_PASSPHRASE,
}

// bybit
interface BybitConfig {
  apiKey: string
  secretKey: string
}
const { BYBIT_APIKEY, BYBIT_SECRETKEY } = confBuilder(['BYBIT_APIKEY', 'BYBIT_SECRETKEY'])
const bybitConfig: BybitConfig = {
  apiKey: BYBIT_APIKEY,
  secretKey: BYBIT_SECRETKEY,
}

export { bitgetConfig, bybitConfig }
