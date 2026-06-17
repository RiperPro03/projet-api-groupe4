import FeedList from "@/components/feed/FeedList";

export default function Home() {
  return (
    <section className="min-h-[calc(100svh-64px)] bg-breezy-black px-4 py-6 text-white md:min-h-svh">
      <div className="mx-auto w-full max-w-2xl">
        <FeedList />
      </div>
    </section>
  );
}
