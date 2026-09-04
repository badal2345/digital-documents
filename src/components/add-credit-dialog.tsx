"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const AMOUNTS = [20, 100, 500, 1000, 3000] as const;

export function AddCreditDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, submitting]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const cleanTransactionId = transactionId.trim();
    if (cleanTransactionId.length < 4) {
      setError("Enter a valid transaction ID.");
      return;
    }
    setSubmitting(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session has expired. Please sign in again.");
      setSubmitting(false);
      return;
    }
    const { error: insertError } = await supabase.from("credit_topup_requests").insert({
      user_id: user.id,
      transaction_id: cleanTransactionId,
      amount,
    });
    if (insertError) {
      setError(insertError.code === "23505" ? "This transaction ID has already been submitted." : insertError.message);
      setSubmitting(false);
      return;
    }
    setSuccess(true);
    setSubmitting(false);
    router.refresh();
  }

  function close() {
    if (submitting) return;
    setOpen(false);
    window.setTimeout(() => {
      setSuccess(false);
      setError("");
      setTransactionId("");
      setAmount(100);
    }, 200);
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="btn bg-white text-indigo-700 shadow-lg shadow-indigo-950/15 hover:bg-indigo-50">
      <Plus className="h-4 w-4" />Add credit
    </button>
    {open && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-labelledby="add-credit-title" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <form onSubmit={submit} className="card my-auto w-full max-w-lg overflow-hidden text-slate-900">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div><h2 id="add-credit-title" className="text-xl font-bold">Add credit</h2><p className="mt-1 text-sm text-slate-500">Pay using the QR code and submit the payment details.</p></div>
          <button type="button" onClick={close} disabled={submitting} className="rounded-lg p-2 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {success ? <div className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 text-lg font-bold">Request submitted</h3>
          <p className="mt-2 text-sm text-slate-500">An admin will review your payment. Credits will be added after approval.</p>
          <button type="button" onClick={close} className="btn btn-primary mt-6 w-full">Done</button>
        </div> : <>
          <div className="max-h-[72vh] overflow-y-auto p-5">
            <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><Image src="/qr.png" alt="Payment QR code" width={220} height={220} priority /></div>
            <p className="mt-3 text-center text-xs text-slate-500">Scan this QR code with your payment app</p>
            <fieldset className="mt-6"><legend className="label">Select amount</legend><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{AMOUNTS.map(value => <button key={value} type="button" onClick={() => setAmount(value)} className={`rounded-xl border px-2 py-3 text-sm font-bold transition ${amount === value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white hover:border-indigo-300"}`}>₹{value.toLocaleString("en-IN")}</button>)}</div></fieldset>
            <label className="mt-5 block"><span className="label">Transaction ID</span><input className="field" value={transactionId} onChange={event => setTransactionId(event.target.value)} maxLength={100} placeholder="Enter UPI transaction ID" autoComplete="off" required /></label>
            <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-800"><span className="font-bold">Selected amount: ₹{amount.toLocaleString("en-IN")}</span><br />You will receive {amount / 10} credits after approval.</div>
            {error && <p className="mt-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</p>}
          </div>
          <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-4"><button type="button" onClick={close} disabled={submitting} className="btn flex-1 border border-slate-200 bg-white">Cancel</button><button disabled={submitting} className="btn btn-primary flex-1">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}{submitting ? "Submitting…" : "Submit for review"}</button></div>
        </>}
      </form>
    </div>}
  </>;
}
