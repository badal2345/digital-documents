"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
export default function ForgotPassword(){
 const [step,setStep]=useState(1),[phone,setPhone]=useState("+91"),[otp,setOtp]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[seconds,setSeconds]=useState(0),[message,setMessage]=useState("");
 useEffect(()=>{ if(!seconds)return; const id=setInterval(()=>setSeconds(v=>v-1),1000); return()=>clearInterval(id)},[seconds]);
 async function send(){setMessage("");const {error}=await createClient().auth.signInWithOtp({phone});if(error)return setMessage(error.message);setSeconds(60);setStep(2)}
 async function verify(){const {error}=await createClient().auth.verifyOtp({phone,token:otp,type:"sms"});if(error)return setMessage(error.message);setStep(3)}
 async function update(){if(password.length<8||password!==confirm)return setMessage("Passwords must match and contain at least 8 characters.");const {error}=await createClient().auth.updateUser({password});if(error)return setMessage(error.message);setStep(4)}
 return <main className="min-h-screen flex items-center justify-center p-6"><section className="card w-full max-w-lg p-8 sm:p-10"><Link href="/login" className="inline-flex gap-2 text-sm text-slate-500"><ArrowLeft className="h-4"/>Back to login</Link><div className="mt-7 rounded-2xl bg-indigo-50 p-3 text-indigo-600 w-fit"><KeyRound/></div><h1 className="mt-5 text-3xl font-bold">Reset your password</h1><p className="mt-2 text-slate-500">Step {Math.min(step,3)} of 3 · {step===1?"Find your account":step===2?"Verify the OTP":"Choose a new password"}</p>
 <div className="my-7 flex gap-2">{[1,2,3].map(n=><span key={n} className={`h-1.5 flex-1 rounded ${n<=step?"bg-indigo-600":"bg-slate-200"}`}/>)}</div>
 {step===1&&<><label className="label">Registered mobile number</label><input className="field" value={phone} onChange={e=>setPhone(e.target.value)}/><button className="btn btn-primary mt-5 w-full" onClick={send}>Send OTP</button></>}
 {step===2&&<><label className="label">6-digit OTP</label><input className="field text-center tracking-[.5em]" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))}/><button className="btn btn-primary mt-5 w-full" onClick={verify}>Verify OTP</button><button disabled={seconds>0} onClick={send} className="mt-4 w-full text-sm font-bold text-indigo-600">{seconds?`Resend in ${seconds}s`:"Resend OTP"}</button></>}
 {step===3&&<><label className="label">New password</label><input type="password" className="field" value={password} onChange={e=>setPassword(e.target.value)}/><label className="label mt-4">Confirm password</label><input type="password" className="field" value={confirm} onChange={e=>setConfirm(e.target.value)}/><button className="btn btn-primary mt-5 w-full" onClick={update}>Update password</button></>}
 {step===4&&<div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500"/><h2 className="mt-4 text-xl font-bold">Password updated</h2><Link href="/login" className="btn btn-primary mt-5">Continue to login</Link></div>}{message&&<p className="error mt-4">{message}</p>}</section></main>
}
