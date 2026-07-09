import { redirect } from "next/navigation";

export default function InventoryNewRedirectPage() {
  redirect("/admin/cards/new");
}
