import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="not-found">
      <span><Compass /></span>
      <p className="eyebrow">404 · LOST LEDGER</p>
      <h1>This page is not in your plan.</h1>
      <p>The address may have changed, or the page may no longer exist.</p>
      <Button asChild>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/"><ArrowLeft />Back to overview</a>
      </Button>
    </main>
  );
}
