import { Component, type ErrorInfo, type ReactNode } from "react"
import { EmptyWarp } from "../sadu/parts"

type BoundaryProps = { name: string; resetKey?: string; fallback?: ReactNode; children: ReactNode }
type BoundaryState = { failed: boolean; resetKey?: string }

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true }
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`${this.props.name} failed to render`, error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback ?? <EmptyWarp>{this.props.name} is back on the loom for a moment.</EmptyWarp>
    return this.props.children
  }
}

export { Boundary }
