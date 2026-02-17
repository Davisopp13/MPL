export default function MplHeader() {
  return (
    <header className="bg-gradient-to-r from-mpl-primary-dark to-mpl-primary px-4 py-3">
      <div className="mx-auto flex max-w-[430px] items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-lg font-bold text-white">
          M
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight text-white">
            MPL
          </h1>
          <p className="text-xs leading-tight text-white/70">
            Manual Process Log
          </p>
        </div>
      </div>
    </header>
  );
}
