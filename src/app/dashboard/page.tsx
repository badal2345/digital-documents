import Link from "next/link";
import { ArrowUpRight, FilePlus2, ReceiptIndianRupee, Sparkles, WalletCards } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { AddCreditDialog } from "@/components/add-credit-dialog";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: wallet }, { data: documents }, { data: transactions }] = await Promise.all([
    supabase.from("credit_wallets").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("generated_documents").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("credit_transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const totalCredits = Number(wallet?.total_credits ?? 0);
  const availableCredits = Number(wallet?.available_credits ?? 0);
  const usedCredits = Number(wallet?.credits_used ?? 0);
  const creditCharge = Number(wallet?.credit_charge ?? 10);
  const remainingAmount = availableCredits * creditCharge;
  const usagePercent = totalCredits > 0 ? Math.min(100, (usedCredits / totalCredits) * 100) : 0;

  return <div className="mx-auto max-w-7xl">
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-2xl font-bold">Good to see you 👋</h2>
        <p className="mt-1 text-slate-500">Here’s what’s happening in your workspace.</p>
        <p className="mt-2 text-sm font-semibold text-indigo-600">₹{creditCharge.toLocaleString("en-IN")} = 1 credit</p>
      </div>
      <Link className="btn btn-primary" href="/dashboard/generate"><FilePlus2 className="h-5" />Generate document</Link>
    </section>

    <section className="mt-7 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
      <article className="relative overflow-hidden rounded-[18px] border border-indigo-700 bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-800 p-6 text-white shadow-lg shadow-indigo-200/60">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold text-indigo-100">Credit balance</p><p className="mt-1 text-3xl font-black">{availableCredits.toLocaleString("en-IN")} <span className="text-base font-semibold text-indigo-200">available</span></p></div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white"><WalletCards className="h-6 w-6" /></span>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15" aria-label={`${usagePercent.toFixed(1)}% of credits used`}><div className="h-full min-w-1 rounded-full bg-white" style={{ width: `${usagePercent}%` }} /></div>
        <div className="mt-6 grid grid-cols-3 divide-x divide-white/15 rounded-2xl border border-white/10 bg-white/10 py-4 text-center backdrop-blur-sm">
          <BalanceStat label="Total credits" value={totalCredits} />
          <BalanceStat label="Remaining" value={availableCredits} />
          <BalanceStat label="Credits used" value={usedCredits} />
        </div>
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[18px] border border-indigo-700 bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-800 p-6 text-white shadow-lg shadow-indigo-200/60">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
        <div className="relative flex h-full min-h-52 flex-col justify-between">
          <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-indigo-100">Remaining amount</p><p className="mt-2 text-4xl font-black">₹{remainingAmount.toLocaleString("en-IN")}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><ReceiptIndianRupee className="h-6 w-6" /></span></div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-indigo-50"><Sparkles className="h-4 w-4" />Enough for {availableCredits.toLocaleString("en-IN")} generations</div><AddCreditDialog /></div>
        </div>
      </article>
    </section>

    <section className="mt-7 grid gap-6 xl:grid-cols-2">
      <List title="Recent document activity" empty="No documents yet. Create your first document." items={(documents || []).map(d => ({ title: d.document_type, meta: new Date(d.created_at).toLocaleDateString("en-IN"), tag: d.status }))} />
      <List title="Recent credit transactions" empty="Your credit activity will appear here." items={(transactions || []).map(t => ({ title: t.description, meta: new Date(t.created_at).toLocaleDateString("en-IN"), tag: `${t.credits > 0 ? "+" : ""}${t.credits}` }))} />
    </section>
  </div>;
}

function BalanceStat({ label, value }: { label: string; value: number }) {
  return <div className="px-2"><p className="text-xl font-black text-white sm:text-2xl">{value.toLocaleString("en-IN")}</p><p className="mt-1 text-xs font-semibold text-indigo-100">{label}</p></div>;
}

function List({ title, empty, items }: { title: string; empty: string; items: { title: string; meta: string; tag: string }[] }) {
  return <article className="card overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><h3 className="font-bold">{title}</h3><ArrowUpRight className="h-4 text-slate-400" /></div>{items.length ? <div className="divide-y divide-slate-100">{items.map((item, index) => <div key={index} className="flex items-center justify-between p-5"><div><p className="font-semibold">{item.title}</p><p className="text-xs text-slate-500">{item.meta}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">{item.tag}</span></div>)}</div> : <div className="p-10 text-center text-sm text-slate-500">{empty}</div>}</article>;
}
