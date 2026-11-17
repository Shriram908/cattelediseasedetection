import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-background text-foreground"><h1 className="text-2xl font-bold">CattleCare AI</h1><p>Something went wrong. Please reload and try again.</p><Button onClick={() => window.location.reload()}>Reload</Button></main>;
    return this.props.children;
  }
}