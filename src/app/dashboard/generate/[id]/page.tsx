import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditableDocument from "./EditableDocument";

type Details = {
  aadhaarNumber?: string;
  guardianName?: string;
  fullName?: string;
  houseNo?: string;
  locality?: string;
  postOffice?: string;
  city?: string;
  state?: string;
  pincode?: string;
  dob?: string;
  gender?: string;
  language?: string;
  enrollmentNumber?: string;
  hindiAddress?: string;
  hindiName?: string;
  issueDate?: string;
};

export default async function GeneratedIdDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: document } = await supabase
    .from("generated_documents")
    .select("id,document_data,document_url,status,credits_used,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!document) notFound();

  const details = (document.document_data ?? {}) as Details;
  const { data: signedPhoto } = document.document_url
    ? await supabase.storage.from("id-profile-pictures").createSignedUrl(document.document_url, 600)
    : { data: null };
  const address = [details.houseNo, details.locality, details.postOffice, details.city, details.state, details.pincode].filter(Boolean).join(", ");

  return <div className="mx-auto max-w-5xl">
    <div className="mb-8"><EditableDocument data={{
      ...details,
      address,
      createdAt: document.created_at,
      enrollmentNumber: details.enrollmentNumber || enrollmentFromId(document.id),
    }} photoUrl={signedPhoto?.signedUrl} /></div>
  </div>;
}

function enrollmentFromId(id: string) {
  const numeric = Number.parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 10000;
  return String(numeric).padStart(4, "0");
}
