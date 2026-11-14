import Dashboard from "@/components/Dashboard";
import { getUser } from "@/lib/auth";
import { blobAccess, isBlobMode } from "@/lib/storage";
import { blobPrefixFor } from "@/lib/blobPath";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  return <Dashboard uploadMode={isBlobMode() ? "blob" : "disk"} blobAccess={blobAccess()} blobPrefix={blobPrefixFor(user.id)} />;
};

export default Page;
