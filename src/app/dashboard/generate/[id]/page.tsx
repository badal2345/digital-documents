import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditableDocument from "./EditableDocument";

type Details = {
  aadhaarNumber?: string;
  guardianName?: string;
  guardianRelation?: string;
  hindiGuardianRelation?: string;
  hindiGuardianName?: string;
  fullName?: string;
  houseNo?: string;
  hindiHouseNo?: string;
  locality?: string;
  hindiLocality?: string;
  policeStation?: string;
  hindiPoliceStation?: string;
  postOffice?: string;
  hindiPostOffice?: string;
  city?: string;
  hindiCity?: string;
  state?: string;
  hindiState?: string;
  pincode?: string;
  dob?: string;
  gender?: string;
  hindiGender?: string;
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
  const policeStation = details.policeStation ? `Police Station: ${details.policeStation}` : "";
  const hindiPoliceStation = details.hindiPoliceStation ? `थाना: ${details.hindiPoliceStation}` : "";
  const address = [details.houseNo, details.locality, policeStation, details.postOffice, details.city, details.state, details.pincode].filter(Boolean).join(", ");
  const hindiAddress = [details.hindiHouseNo, details.hindiLocality, hindiPoliceStation, details.hindiPostOffice, details.hindiCity, details.hindiState, details.pincode].filter(Boolean).join(", ") || details.hindiAddress;

  return <div className="mx-auto max-w-5xl">
    <div className="mb-8"><EditableDocument data={{
      ...details,
      address,
      hindiAddress,
      createdAt: document.created_at,
      enrollmentNumber: details.enrollmentNumber || enrollmentFromId(document.id),
    }} photoUrl={signedPhoto?.signedUrl} /></div>
  </div>;
}

function enrollmentFromId(id: string) {
  const numeric = Number.parseInt(id.replace(/-/g, "").slice(0, 8), 16) % 10000;
  return String(numeric).padStart(4, "0");
}
