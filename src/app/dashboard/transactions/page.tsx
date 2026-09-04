import { createClient } from "@/utils/supabase/server";
import { TransactionsTabs } from "./TransactionsTabs";

export default async function Transactions() {
  const supabase = await createClient();
  const [{ data: transactions }, { data: topups, error: topupError }] = await Promise.all([
    supabase.from("credit_transactions").select("id,description,transaction_type,credits,amount,created_at").order("created_at", { ascending: false }),
    supabase.from("credit_topup_requests").select("id,transaction_id,amount,status,admin_note,reviewed_at,created_at").order("created_at", { ascending: false }),
  ]);

  return <TransactionsTabs transactions={transactions ?? []} topups={topups ?? []} topupError={topupError?.message} />;
}
