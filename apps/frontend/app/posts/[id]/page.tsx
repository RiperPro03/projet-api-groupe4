import type { Metadata } from "next";
import PostDetail from "@/components/posts/PostDetail";

type PostPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Post ${id.slice(0, 8)}`,
    description: "Detail du post Breezyl.",
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;

  return (
    <section className="min-h-[calc(100svh-64px)] bg-background px-4 py-6 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-2xl">
        <PostDetail postId={id} />
      </div>
    </section>
  );
}
