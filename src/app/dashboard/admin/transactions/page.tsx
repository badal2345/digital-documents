import { requireAdmin } from "@/utils/supabase/admin";
import { AdminTransactionList } from "./AdminTransactionList";

export default async function AdminTransactions(){const supabase=await requireAdmin();const [{data:requests},{data:directory}]=await Promise.all([supabase.from("credit_topup_requests").select("id,user_id,transaction_id,amount,status,admin_note,created_at,reviewed_at").order("created_at",{ascending:false}),supabase.rpc("list_app_users")]);const users=Object.fromEntries((directory??[]).map((user:{user_id:string;full_name:string;email:string|null;phone_number:string|null})=>[user.user_id,{name:user.full_name,email:user.email,phone:user.phone_number??""}]));return <AdminTransactionList requests={requests??[]} users={users}/>}
