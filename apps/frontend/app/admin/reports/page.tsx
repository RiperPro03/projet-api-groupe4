import { AdminReportsTable } from "@/components/admin/AdminReportsTable";

export default function AdminReportsPage() {
  return (
    <section className="min-h-[calc(100svh-64px)] bg-transparent px-4 py-8 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-6xl">
        <AdminReportsTable />
      </div>
    </section>
  );
}
