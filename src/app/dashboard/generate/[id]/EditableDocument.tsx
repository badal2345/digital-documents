"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import styles from "./EditableDocument.module.css";

export type EditableDocumentData = {
  aadhaarNumber?: string; address?: string; createdAt?: string; dob?: string;
  enrollmentNumber?: string; fullName?: string; gender?: string; hindiGender?: string; guardianName?: string;
  guardianRelation?: string; hindiGuardianRelation?: string; hindiGuardianName?: string;
  hindiAddress?: string; hindiName?: string; issueDate?: string;
};

function Field({ children, className, placeholder }: { children?:React.ReactNode; className:string; placeholder:string }) {
  return <div className={`${styles.field} ${className}`}>{children || <span className={styles.placeholder}>{placeholder}</span>}</div>;
}

export default function EditableDocument({ data, photoUrl }: { data:EditableDocumentData; photoUrl?:string }) {
  const documentRef=useRef<HTMLElement>(null);
  const [downloading,setDownloading]=useState(false);
  const [downloadError,setDownloadError]=useState("");
  const name=[data.hindiName,data.fullName].filter(Boolean).join("\n");
  const cardName=[data.hindiName,data.fullName].filter(Boolean).join("\n");
  const downloadDate=formatDate(data.createdAt);
  const issueDate=formatDate(data.issueDate ?? data.createdAt);
  const dob=formatDate(data.dob);
  const relation=data.guardianRelation ?? "Guardian";
  const relationLabel=relation === "Father" ? (data.gender === "Female" ? "D/O" : "S/O") : relation === "Husband" ? "W/O" : "C/O";
  const hindiRelationLabel=data.hindiGuardianRelation ?? (relation === "Father" ? "पिता" : relation === "Husband" ? "पति" : "अभिभावक");
  const relative=data.guardianName ? `${relationLabel}: ${data.guardianName}` : "";
  const hindiRelative=data.hindiGuardianName ? `${hindiRelationLabel}: ${data.hindiGuardianName}` : "";
  const address=[relative,data.address].filter(Boolean).join(", ");
  const hindiAddress=[hindiRelative,data.hindiAddress].filter(Boolean).join(", ");
  const bilingualAddress=hindiAddress ? <><strong>पता:</strong><br/>{hindiAddress}<br/><strong>Address:</strong><br/>{address}</> : address ? <><strong>Address:</strong><br/>{address}</> : "";
  const aadhaar=formatAadhaar(data.aadhaarNumber);

  async function downloadPdf(){
    if(!documentRef.current||downloading)return;
    setDownloading(true);setDownloadError("");
    try{
      await document.fonts.ready;
      const [{toPng},{jsPDF}]=await Promise.all([import("html-to-image"),import("jspdf")]);
      const image=await toPng(documentRef.current,{pixelRatio:2,cacheBust:true,backgroundColor:"#ffffff"});
      const pdf=new jsPDF({orientation:"portrait",unit:"px",format:[816,1056],hotfixes:["px_scaling"]});
      pdf.addImage(image,"PNG",0,0,816,1056,undefined,"FAST");
      const filename=`${(data.fullName||"document").trim().replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()||"document"}.pdf`;
      pdf.save(filename);
    }catch{
      setDownloadError("Could not create the PDF. Please try again.");
    }finally{
      setDownloading(false);
    }
  }

  return <div className={styles.editor}>
    <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
      {downloadError&&<p className="text-sm text-red-600" role="alert">{downloadError}</p>}
      <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={downloading}>{downloading?<Loader2 className="h-5 w-5 animate-spin"/>:<Download className="h-5 w-5"/>}{downloading?"Creating PDF…":"Download PDF"}</button>
    </div>
    <main ref={documentRef} className={styles.page}>
    <Image className={styles.background} src="/testing-page.png" alt="Aadhaar document template" fill sizes="(max-width:816px) 100vw, 816px" priority/>
    <Field className={styles.datetime} placeholder="Document date">{downloadDate}</Field>
    <Field className={`${styles.title} ${styles.center}`} placeholder="Document type">PDF</Field>
    <div className={`${styles.field} ${styles.enrollment}`}>नामांकन क्रम / Enrollment No: {data.enrollmentNumber}</div>
    <Field className={styles.toName} placeholder="Full name"><strong>To,</strong><br/>{name}</Field>
    <Field className={styles.addressTop} placeholder="Address">{bilingualAddress}</Field>
    <Field className={styles.downloadLeft} placeholder="Download date">{downloadDate ? `Download Date: ${downloadDate}` : ""}</Field>
    <Field className={styles.issueLeft} placeholder="Issue date">{issueDate ? `Issue Date: ${issueDate}` : ""}</Field>
    <Field className={`${styles.numberMain} ${styles.center}`} placeholder="Aadhaar number">{aadhaar}</Field>
    <div className={styles.photoWrap}>{photoUrl&&<Image src={photoUrl} alt={`${data.fullName ?? "User"} portrait`} fill unoptimized/>}</div>
    <div className={`${styles.field} ${styles.identityCard}`}>
      <div>{cardName}</div>
      <div>{dob ? `जन्म तिथि / DOB : ${dob}` : ""}</div>
      <div>{[data.hindiGender,data.gender].filter(Boolean).join(" / ")}</div>
    </div>
    <Field className={styles.downloadCard} placeholder="Download date">{downloadDate ? `Download Date: ${downloadDate}` : ""}</Field>
    <Field className={styles.issueCard} placeholder="Issue date">{issueDate ? `Issue Date: ${issueDate}` : ""}</Field>
    <Field className={`${styles.numberCardLeft} ${styles.center}`} placeholder="Aadhaar number">{aadhaar}</Field>
    <Field className={styles.nameAddressRight} placeholder="Address">{bilingualAddress}</Field>
    <Field className={`${styles.numberCardRight} ${styles.center}`} placeholder="Aadhaar number">{aadhaar}</Field>
    </main>
  </div>;
}

function formatAadhaar(value?:string) { return value?.replace(/\s/g,"").replace(/(\d{4})(?=\d)/g,"$1 ") ?? ""; }
function formatDate(value?:string) {
  if (!value) return "";
  const date=new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}
