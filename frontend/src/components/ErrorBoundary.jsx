import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error("Voxora render error", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto mt-16 max-w-xl rounded-2xl border border-line bg-surface p-8 text-center">
        <h1 className="font-display text-xl font-bold text-ink">
          This page ran into a problem
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your saved meeting data is still in this browser session. Return home or try
          this page again.
        </p>
        <button
          className="mt-5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </button>{" "}
        <Link className="ml-3 text-sm text-[var(--accent-strong)]" to="/">
          Home
        </Link>
      </main>
    );
  }
}
