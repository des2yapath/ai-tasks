"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/database/client";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!tokenHash || !type) return;
    const supabase = getSupabaseBrowserClient();
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as never })
      .then(({ error: verifyErr }) => {
        if (verifyErr) setVerifyError(verifyErr.message);
        else setVerified(true);
      });
  }, [tokenHash, type]);

  const errorMessage = error
    ? errorDescription || error
    : !tokenHash || !type
      ? "This confirmation link is invalid or has expired."
      : verifyError;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {errorMessage ? "Confirmation failed" : verified ? "Email confirmed" : "Confirming…"}
      </h1>
      {errorMessage ? <p className="text-sm text-muted-foreground">{errorMessage}</p> : null}
      {verified ? (
        <Link href="/today" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Continue to the app
        </Link>
      ) : null}
      {errorMessage ? (
        <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to login
        </Link>
      ) : null}
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmContent />
    </Suspense>
  );
}
