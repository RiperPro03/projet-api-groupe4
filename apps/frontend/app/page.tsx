import FeedList from "@/components/feed/FeedList";

export default function Home() {
  return (
    <section className="min-h-[calc(100svh-64px)] bg-background px-4 py-6 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-2xl">
        <FeedList />
      </div>
    </section>
  );
}
