import Link from "next/link";
import PostTable from "@/components/admin/PostTable";

export const metadata = { title: "Pages" };
export const dynamic = "force-dynamic";

export default async function PagesPage(props: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <>
      <header className="adm-head">
        <h1>Pages</h1>
        <Link className="adm-btn" href="/admin/pages/new">New page</Link>
      </header>
      <PostTable type="page" status={searchParams.status ?? "all"} q={(searchParams.q ?? "").slice(0, 100)} />
    </>
  );
}
