"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="not-found">
      <span><AlertTriangle /></span>
      <p className="eyebrow">SOMETHING WENT WRONG</p>
      <h1>Your plan could not be displayed.</h1>
      <p>Nothing was deleted. Try loading this screen again.</p>
      <Button onClick={reset}><RotateCcw />Try again</Button>
    </main>
  );
}
