type MessageHandler = (data: unknown) => void

export class WSConnection {
  private ws: WebSocket | null = null
  private url: string
  private handlers: MessageHandler[] = []
  private retryDelay = 1000
  private maxDelay = 16000
  private alive = true

  constructor(url: string) {
    this.url = url
    this.connect()
  }

  private connect() {
    if (!this.alive) return
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const fullUrl = this.url.startsWith('ws') ? this.url : `${proto}//${host}${this.url}`

    this.ws = new WebSocket(fullUrl)

    this.ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        this.handlers.forEach(h => h(data))
      } catch {}
    }

    this.ws.onclose = () => {
      if (!this.alive) return
      setTimeout(() => {
        this.retryDelay = Math.min(this.retryDelay * 2, this.maxDelay)
        this.connect()
      }, this.retryDelay)
    }

    this.ws.onopen = () => {
      this.retryDelay = 1000
    }
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter(h => h !== handler)
    }
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  destroy() {
    this.alive = false
    this.ws?.close()
  }
}
