import FeedList from "@/components/feed/FeedList";
import { Particles } from "@/components/ui/particles";

export default function Home() {
  return (
    <section className="relative min-h-[calc(100svh-64px)] overflow-hidden bg-background px-4 py-6 text-foreground md:min-h-svh">
      <Particles
        className="z-0"
        quantity={360}
        color="var(--foreground)"
        size={1.2}
        speed={0.35}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <FeedList />
      </div>
    </section>
  );
}
