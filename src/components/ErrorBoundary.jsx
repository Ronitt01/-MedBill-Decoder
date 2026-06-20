import { Component } from 'react'

// Keeps a WebGL/3D failure from taking down the whole page during a live demo.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Non-fatal: log and show the fallback.
    console.warn('3D scene failed, showing fallback:', error?.message)
  }

  render() {
    if (this.state.hasError) return this.props.fallback || null
    return this.props.children
  }
}
