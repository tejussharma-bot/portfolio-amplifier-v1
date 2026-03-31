import { PublishStudioPage } from "@/components/dashboard/publish-studio-page";

export default function PublishStudioRoute({
  searchParams
}: {
  searchParams?: { project?: string };
}) {
  return <PublishStudioPage initialProjectId={searchParams?.project} />;
}
