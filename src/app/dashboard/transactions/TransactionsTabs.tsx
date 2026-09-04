"use client";

import { useState } from "react";
import { ArrowDownUp, CircleDollarSign } from "lucide-react";

type CreditTransaction = { id:string; description:string; transaction_type:string; credits:number; amount:number; created_at:string };
type TopupRequest = { id:string; transaction_id:string; amount:number; status:"pending"|"approved"|"rejected"; admin_note:string|null; reviewed_at:string|null; created_at:string };

export function TransactionsTabs({transactions,topups,topupError}:{transactions:CreditTransaction[];topups:TopupRequest[];topupError?:string}) {
  const [tab,setTab]=useState<"credits"|"added">("credits");
  return <section className="card overflow-hidden">
    <div className="border-b border-slate-100 p-6"><h2 className="text-xl font-bold">Transactions</h2><p className="mt-1 text-sm text-slate-500">Review credit activity and submitted payment requests.</p>
      <div className="mt-5 flex gap-2 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Transaction type"><TabButton active={tab==="credits"} onClick={()=>setTab("credits")}><ArrowDownUp className="h-4 w-4"/>Credit transactions</TabButton><TabButton active={tab==="added"} onClick={()=>setTab("added")}><CircleDollarSign className="h-4 w-4"/>Added transactions{topups.length>0&&<span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{topups.length}</span>}</TabButton></div>
    </div>
    {tab==="credits"?<CreditTable transactions={transactions}/>:<TopupTable topups={topups} error={topupError}/>} 
  </section>;
}

function TabButton({active,onClick,children}:{active:boolean;onClick:()=>void;children:React.ReactNode}){return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold transition ${active?"bg-indigo-600 text-white shadow-sm":"text-slate-600 hover:bg-white/70"}`}>{children}</button>}

function CreditTable({transactions}:{transactions:CreditTransaction[]}) {
  if(!transactions.length)return <Empty text="No credit transactions yet."/>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Description</th><th className="p-4">Type</th><th className="p-4">Credits</th><th className="p-4">Amount</th><th className="p-4">Date</th></tr></thead><tbody>{transactions.map(t=><tr className="border-t border-slate-100" key={t.id}><td className="p-4 font-semibold">{t.description}</td><td className="p-4 capitalize">{t.transaction_type}</td><td className="p-4">{t.credits>0?"+":""}{t.credits}</td><td className="p-4">₹{Math.abs(Number(t.amount)).toLocaleString("en-IN")}</td><td className="p-4 text-slate-500">{formatDate(t.created_at)}</td></tr>)}</tbody></table></div>;
}

function TopupTable({topups,error}:{topups:TopupRequest[];error?:string}) {
  if(error)return <div className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">Unable to load added transactions: {error}</div>;
  if(!topups.length)return <Empty text="No added transactions submitted yet."/>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Transaction ID</th><th className="p-4">Amount</th><th className="p-4">Credits</th><th className="p-4">Submitted</th><th className="p-4">Status</th><th className="p-4">Admin note</th></tr></thead><tbody>{topups.map(t=><tr className="border-t border-slate-100" key={t.id}><td className="p-4 font-mono font-semibold">{t.transaction_id}</td><td className="p-4 font-semibold">₹{Number(t.amount).toLocaleString("en-IN")}</td><td className="p-4">{Number(t.amount)/10}</td><td className="p-4 text-slate-500">{formatDate(t.created_at)}</td><td className="p-4"><Status status={t.status}/></td><td className="max-w-64 p-4 text-slate-500">{t.admin_note||"—"}</td></tr>)}</tbody></table></div>;
}

function Status({status}:{status:TopupRequest["status"]}){const style=status==="approved"?"bg-emerald-50 text-emerald-700":status==="rejected"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-700";return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${style}`}>{status}</span>}
function Empty({text}:{text:string}){return <div className="p-14 text-center text-sm text-slate-500">{text}</div>}
function formatDate(value:string){return new Date(value).toLocaleString("en-IN")}
