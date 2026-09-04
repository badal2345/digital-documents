"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
export function BlockedAccount(){const router=useRouter();async function logout(){await createClient().auth.signOut();router.replace("/login");router.refresh()}return <button className="btn btn-primary mt-6" onClick={logout}>Return to sign in</button>}
