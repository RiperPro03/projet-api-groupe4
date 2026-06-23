import FeedList from "@/components/feed/FeedList";

export default function Home() {
  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-transparent px-4 py-6 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-2xl">
        <FeedList />
      </div>
    </section>
  );
}
