import type { Metadata } from "next";
import { Suspense } from "react";
import { Group, Loader } from "@mantine/core";
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
    <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-6 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-2xl">
        <Suspense
          fallback={
            <Group justify="center" py="xl">
              <Loader color="green" />
            </Group>
          }
        >
          <PostDetail postId={id} />
        </Suspense>
      </div>
    </section>
  );
}
