import { requireAdmin } from "@/utils/supabase/admin";
import { AdminUserList } from "./AdminUserList";

export default async function AdminUsers(){const supabase=await requireAdmin();const [{data:users,error},{data:blocked}]=await Promise.all([supabase.rpc("list_app_users"),supabase.from("blocked_users").select("user_id,note,created_at")]);const blockedMap=Object.fromEntries((blocked??[]).map(entry=>[entry.user_id,{note:entry.note,createdAt:entry.created_at}]));return <AdminUserList users={users??[]} blocked={blockedMap} error={error?.message}/>}
