"use client";

import Image from "next/image";
import styles from "./EditableDocument.module.css";

export type EditableDocumentData = {
  aadhaarNumber?: string; address?: string; createdAt?: string; dob?: string;
  enrollmentNumber?: string; fullName?: string; gender?: string; guardianName?: string;
  hindiAddress?: string; hindiName?: string; issueDate?: string;
};

function Field({ children, className, placeholder }: { children?:React.ReactNode; className:string; placeholder:string }) {
  return <div className={`${styles.field} ${className}`}>{children || <span className={styles.placeholder}>{placeholder}</span>}</div>;
}

export default function EditableDocument({ data, photoUrl }: { data:EditableDocumentData; photoUrl?:string }) {
  const name=[data.hindiName,data.fullName].filter(Boolean).join("\n");
  const downloadDate=formatDate(data.createdAt);
  const issueDate=formatDate(data.issueDate ?? data.createdAt);
  const dob=formatDate(data.dob);
  const address=[data.guardianName ? `C/O: ${data.guardianName}` : "",data.address].filter(Boolean).join(", ");
  const aadhaar=formatAadhaar(data.aadhaarNumber);

  return <div className={styles.editor}><main className={styles.page}>
    <Image className={styles.background} src="/testing-page.png" alt="Aadhaar document template" fill sizes="(max-width:816px) 100vw, 816px" priority/>
    <Field className={styles.datetime} placeholder="Document date">{downloadDate}</Field>
    <Field className={`${styles.title} ${styles.center}`} placeholder="Document type">PDF</Field>
    <div className={`${styles.field} ${styles.enrollment}`}>नामांकन क्रम / Enrollment No: {data.enrollmentNumber}</div>
    <Field className={styles.toName} placeholder="Full name"> To, <br/> {name}</Field>
    <Field className={styles.addressTop} placeholder="Address">{address}</Field>
    <Field className={styles.downloadLeft} placeholder="Download date">{downloadDate ? `Download Date: ${downloadDate}` : ""}</Field>
    <Field className={styles.issueLeft} placeholder="Issue date">{issueDate ? `Issue Date: ${issueDate}` : ""}</Field>
    <Field className={`${styles.numberMain} ${styles.center}`} placeholder="Aadhaar number">{aadhaar}</Field>
    <div className={styles.photoWrap}>{photoUrl&&<Image src={photoUrl} alt={`${data.fullName ?? "User"} portrait`} fill unoptimized/>}</div>
    <Field className={styles.nameCard} placeholder="Full name">{name}</Field>
    <Field className={styles.dob} placeholder="Date of birth">{dob ? `जन्म तिथि / DOB : ${dob}` : ""}</Field>
    <Field className={styles.gender} placeholder="Gender">{data.gender}</Field>
    <Field className={styles.downloadCard} placeholder="Download date">{downloadDate ? `Download Date: ${downloadDate}` : ""}</Field>
    <Field className={styles.issueCard} placeholder="Issue date">{issueDate ? `Issue Date: ${issueDate}` : ""}</Field>
    <Field className={`${styles.numberCardLeft} ${styles.center}`} placeholder="Aadhaar number">{aadhaar}</Field>
    <Field className={styles.nameAddressRight} placeholder="Address">{data.hindiAddress ? `पता:\n${data.hindiAddress}\n\nAddress:\n${address}` : address ? `Address:\n${address}` : ""}</Field>
    <Field className={`${styles.numberCardRight} ${styles.center}`} placeholder="Aadhaar number">{aadhaar}</Field>
  </main></div>;
}

function formatAadhaar(value?:string) { return value?.replace(/\s/g,"").replace(/(\d{4})(?=\d)/g,"$1 ") ?? ""; }
function formatDate(value?:string) {
  if (!value) return "";
  const date=new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}
