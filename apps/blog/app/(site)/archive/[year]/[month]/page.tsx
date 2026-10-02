import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { monthName } from "@ihern/core/text";
import { ArchiveHeading, Listing, parsePage } from "@/components/Listing";

export const dynamic = "force-dynamic";

type Params = { year: string; month?: string };

function parse(p: Params) {
  const year = /^\d{4}$/.test(p.year) ? Number(p.year) : null;
  const month = p.month === undefined ? undefined : /^(0?[1-9]|1[0-2])$/.test(p.month) ? Number(p.month) : null;
  return { year, month };
}

export async function generateMetadata(props: { params: Promise<Params> }): Promise<Metadata> {
  const params = await props.params;
  const { year, month } = parse(params);
  if (!year || month === null) return {};
  return {
    title: month ? `${monthName(month)} ${year}` : String(year),
    alternates: { canonical: month ? `/archive/${year}/${String(month).padStart(2, "0")}` : `/archive/${year}` },
  };
}

export default async function ArchivePage(props: { params: Promise<Params>; searchParams: Promise<{ page?: string }> }) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { year, month } = parse(params);
  if (!year || month === null) notFound();
  const base = month ? `/archive/${year}/${String(month).padStart(2, "0")}` : `/archive/${year}`;
  return (
    <main className="b-wrap" id="main">
      <ArchiveHeading kind={month ? "Month" : "Year"} title={month ? `${monthName(month)} ${year}` : String(year)} />
      <Listing base={base} page={parsePage(searchParams.page)} query={{ year, month }} empty="No posts from this time." />
    </main>
  );
}
