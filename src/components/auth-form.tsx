"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, FileCheck2, Loader2, ShieldCheck } from "lucide-react";

const phoneRule = /^[6-9]\d{9}$/;
const loginSchema = z.object({ email:z.email("Enter a valid email address"), password:z.string().min(8,"Password must be at least 8 characters"), remember:z.boolean().optional() });
const registerSchema = loginSchema.extend({ phone:z.string().regex(phoneRule,"Enter a valid 10-digit mobile number"), fullName:z.string().min(2,"Enter your full name"), confirm:z.string(), terms:z.literal(true,{error:"Please accept the terms"}) }).refine(v=>v.password===v.confirm,{path:["confirm"],message:"Passwords do not match"});
type Values = z.infer<typeof registerSchema>;

export function AuthForm({ mode }:{ mode:"login"|"register" }) {
  const router = useRouter();
  const schema = mode === "register" ? registerSchema : loginSchema;
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<Values>({ resolver:zodResolver(schema) as never, defaultValues:{phone:"",remember:true} });
  const [serverError,setServerError]=useState("");
  async function submit(values:Values) {
    setServerError(""); const supabase=createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({email:values.email,password:values.password})
      : await supabase.auth.signUp({email:values.email,password:values.password,options:{data:{full_name:values.fullName,phone_number:`+91${values.phone}`}}});
    if(result.error) return setServerError(result.error.message);
    router.replace("/dashboard"); router.refresh();
  }
  return <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-white">
    <section className="hidden lg:flex relative overflow-hidden bg-[#15264b] p-14 text-white flex-col justify-between">
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 75% 15%,#818cf8 0,transparent 34%),radial-gradient(circle at 10% 90%,#22d3ee 0,transparent 28%)"}} />
      <div className="relative flex items-center gap-3 font-bold text-xl"><span className="rounded-xl bg-indigo-500 p-2"><FileCheck2/></span>Digital Documents</div>
      <div className="relative max-w-lg"><div className="mb-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm"><ShieldCheck className="mr-2 h-4 w-4"/> Secure & compliant workflows</div><h1 className="text-5xl font-bold leading-tight">Documents made simple, secure, and beautifully organized.</h1><p className="mt-5 text-lg leading-8 text-blue-100">Create clearly marked demo documents, manage credits, and keep every activity in one trusted workspace.</p></div>
      <p className="relative text-sm text-blue-200">Protected by secure server sessions and row-level access controls.</p>
    </section>
    <section className="flex items-center justify-center p-6 sm:p-12"><div className="w-full max-w-md">
      <div className="mb-9 lg:hidden flex items-center gap-3 font-bold text-xl"><span className="rounded-xl bg-indigo-600 p-2 text-white"><FileCheck2/></span>Digital Documents</div>
      <p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">{mode === "login" ? "Welcome back" : "Create account"}</p>
      <h2 className="mt-2 text-3xl font-bold">{mode === "login" ? "Sign in to continue" : "Start your secure workspace"}</h2>
      <p className="mt-2 text-slate-500">{mode === "login" ? "Enter your registered email and password." : "A few details and you’ll be ready to go."}</p>
      <form onSubmit={handleSubmit(submit)} className="mt-8 flex flex-col gap-6">
        {mode === "register" && <Field label="Full name" error={errors.fullName?.message}><input className="field" placeholder="Rajesh Kumar" autoComplete="name" {...register("fullName")}/></Field>}
        <Field label="Email address" error={errors.email?.message}><input className="field" type="email" inputMode="email" autoComplete="email" placeholder="rajesh@example.com" {...register("email")}/></Field>
        {mode === "register" && <Field label="Mobile number" error={errors.phone?.message}><input className="field" type="tel" inputMode="numeric" autoComplete="tel" placeholder="9876543210" maxLength={10} {...register("phone")} onInput={event=>{event.currentTarget.value=event.currentTarget.value.replace(/\D/g,"").slice(0,10)}}/></Field>}
        <Field label="Password" error={errors.password?.message}><input className="field" type="password" placeholder="Minimum 8 characters" {...register("password")}/></Field>
        {mode === "register" && <Field label="Confirm password" error={errors.confirm?.message}><input className="field" type="password" placeholder="Repeat password" {...register("confirm")}/></Field>}
        <div className="flex items-center justify-between text-sm"><label className="flex gap-2 text-slate-600"><input type="checkbox" {...register(mode === "login" ? "remember" : "terms")}/>{mode === "login" ? "Remember me" : "I agree to the Terms & Conditions"}</label>{mode === "login" && <Link href="/forgot-password" className="font-bold text-indigo-600">Forgot password?</Link>}</div>
        {mode === "register" && errors.terms && <p className="error">{errors.terms.message}</p>}{serverError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{serverError}</div>}
        <button className="btn btn-primary w-full" disabled={isSubmitting}>{isSubmitting?<Loader2 className="animate-spin"/>:<>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight className="h-4 w-4"/></>}</button>
      </form>
      <p className="mt-7 text-center text-sm text-slate-500">{mode === "login" ? "New to Digital Documents? " : "Already have an account? "}<Link className="font-bold text-indigo-600" href={mode === "login" ? "/register" : "/login"}>{mode === "login" ? "Create account" : "Sign in"}</Link></p>
    </div></section>
  </main>;
}
function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}) { return <label className="block"><span className="label">{label}</span>{children}{error&&<span className="error block">{error}</span>}</label> }
