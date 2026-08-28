import { setupWorker } from 'msw/browser'
import { httpHandlers } from './http-handlers'
import { wsHandlers } from './ws-handlers'

export const worker = setupWorker(...httpHandlers, ...wsHandlers)
