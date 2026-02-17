import MplHeader from "@/components/MplHeader";

export default function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-mpl-bg">
      <MplHeader />
      <main className="p-4">
        <div className="rounded-2xl border border-mpl-border bg-mpl-surface p-6 text-center">
          <p className="text-sm text-slate-500">
            Welcome to MPL. Log your manual processes quickly.
          </p>
        </div>
      </main>
    </div>
  );
}
