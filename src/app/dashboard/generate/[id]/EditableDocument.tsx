"use client";

import Image from "next/image";
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
  const name=[data.hindiName,data.fullName].filter(Boolean).join("\n");
  const cardName=[data.hindiName,data.fullName].filter(Boolean).join("  ");
  const downloadDate=formatDate(data.createdAt);
  const issueDate=formatDate(data.issueDate ?? data.createdAt);
  const dob=formatDate(data.dob);
  const relation=data.guardianRelation ?? "Guardian";
  const relationLabel=relation === "Father" ? "S/O or D/O" : relation === "Husband" ? "W/O" : "C/O";
  const hindiRelationLabel=data.hindiGuardianRelation ?? (relation === "Father" ? "पिता" : relation === "Husband" ? "पति" : "अभिभावक");
  const relative=data.guardianName ? `${relationLabel}: ${data.guardianName}` : "";
  const hindiRelative=data.hindiGuardianName ? `${hindiRelationLabel}: ${data.hindiGuardianName}` : "";
  const address=[relative,data.address].filter(Boolean).join(", ");
  const hindiAddress=[hindiRelative,data.hindiAddress].filter(Boolean).join(", ");
  const bilingualAddress=hindiAddress ? <><strong>पता:</strong><br/>{hindiAddress}<br/><br/><strong>Address:</strong><br/>{address}</> : address ? <><strong>Address:</strong><br/>{address}</> : "";
  const aadhaar=formatAadhaar(data.aadhaarNumber);

  return <div className={styles.editor}><main className={styles.page}>
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
  </main></div>;
}

function formatAadhaar(value?:string) { return value?.replace(/\s/g,"").replace(/(\d{4})(?=\d)/g,"$1 ") ?? ""; }
function formatDate(value?:string) {
  if (!value) return "";
  const date=new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN");
}
