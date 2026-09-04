import { ShieldX } from "lucide-react";
import { BlockedAccount } from "@/components/blocked-account";
export default function AccountBlocked(){return <main className="grid min-h-screen place-items-center p-6"><section className="card max-w-md p-8 text-center"><ShieldX className="mx-auto h-14 w-14 text-red-500"/><h1 className="mt-5 text-2xl font-bold">Account blocked</h1><p className="mt-2 text-slate-500">Your account has been blocked by an administrator. Contact support if you believe this is a mistake.</p><BlockedAccount/></section></main>}
