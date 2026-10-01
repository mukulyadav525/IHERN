import type { Metadata } from "next";
import SubscribeBox from "@/components/SubscribeBox";
import { currentReader, currentSubscribed } from "@/lib/reader";
import { mainUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Subscribe",
  description: "Get new IHERN Blog posts by email, with your IHERN account.",
  alternates: { canonical: "/subscribe" },
};
export const dynamic = "force-dynamic";

/** Subscribe to the blog (the WordPress "Subscribe" page, now tied to the IHERN account). */
export default async function SubscribePage() {
  const [reader, subscribed] = await Promise.all([currentReader(), currentSubscribed()]);
  return (
    <main className="b-wrap b-wrap--narrow" id="main">
      <SubscribeBox heading="h1" signedIn={Boolean(reader)} subscribed={subscribed} returnTo="/subscribe" accountUrl={mainUrl("account")} />
    </main>
  );
}
