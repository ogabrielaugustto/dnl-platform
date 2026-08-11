import { redirect } from "next/navigation";

export default async function AdminPlansPage() {
  redirect("/admin/platform?tab=plans");
}
