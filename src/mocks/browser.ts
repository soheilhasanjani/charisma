import { setupWorker } from 'msw/browser'
import { httpHandlers } from './httpHandlers'
import { wsHandlers } from './wsHandlers'

export const worker = setupWorker(...httpHandlers, ...wsHandlers)
