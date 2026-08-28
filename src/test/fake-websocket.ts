type Listener = (...args: unknown[]) => void

export class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readonly url: string
  readyState = FakeWebSocket.CONNECTING

  private listeners = new Map<string, Set<Listener>>()

  constructor(url: string, options: { openImmediately?: boolean } = {}) {
    this.url = url

    if (options.openImmediately) {
      this.open()
      return
    }

    queueMicrotask(() => {
      if (this.readyState === FakeWebSocket.CONNECTING) {
        this.open()
      }
    })
  }

  addEventListener(type: string, listener: Listener) {
    let bucket = this.listeners.get(type)
    if (!bucket) {
      bucket = new Set()
      this.listeners.set(type, bucket)
    }
    bucket.add(listener)
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  send(data: string) {
    if (this.readyState !== FakeWebSocket.OPEN) {
      throw new Error('FakeWebSocket is not open')
    }
    this.onSend?.(data)
  }

  close(code = 1000, reason = '') {
    if (this.readyState === FakeWebSocket.CLOSED) return
    this.readyState = FakeWebSocket.CLOSED
    this.emit('close', new CloseEvent('close', { code, reason }))
  }

  open() {
    this.readyState = FakeWebSocket.OPEN
    this.emit('open', new Event('open'))
  }

  emit(type: string, event: Event) {
    Object.defineProperty(event, 'target', { value: this, configurable: true })
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }

  receive(data: string) {
    this.emit('message', new MessageEvent('message', { data }))
  }

  onSend?: (data: string) => void
}

export function installFakeWebSocket() {
  class PatchedFakeWebSocket extends FakeWebSocket {
    constructor(url: string | URL) {
      super(String(url), { openImmediately: true })
    }
  }

  vi.stubGlobal('WebSocket', PatchedFakeWebSocket)
  return PatchedFakeWebSocket
}
