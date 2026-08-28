import { Component, type ErrorInfo, type ReactNode } from 'react'

import { Button } from '@/components/primitives/button'
import { i18n } from '@/i18n/i18n'

type RootErrorBoundaryProps = {
  children: ReactNode
}

type RootErrorBoundaryState = {
  error: Error | null
}

export class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[app] root error boundary', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-lg font-semibold">{i18n.t('errors.boundary')}</h1>
          <p className="text-muted-foreground max-w-md text-sm">
            {i18n.t('errors.boundaryHint')}
          </p>
          <Button
            type="button"
            onClick={() => {
              window.location.reload()
            }}
          >
            {i18n.t('common.retry')}
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
