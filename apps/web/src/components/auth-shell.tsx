import type { ReactNode } from 'react';

export function AuthShell({
  children,
  showMark = false,
}: {
  children: ReactNode;
  showMark?: boolean;
}) {
  return (
    <main className="min-h-screen bg-background sm:grid sm:place-items-center sm:px-5 sm:py-8">
      <section className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col px-[23px] pb-6 pt-14 sm:min-h-[680px] sm:rounded-sheet sm:border sm:border-border sm:bg-background">
        {showMark ? (
          <div aria-hidden="true" className="mb-6 size-9 rounded-[11px] bg-primary" />
        ) : null}
        {children}
      </section>
    </main>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-7 space-y-1.5">
      <h1 className="text-[27px] font-semibold tracking-[-0.025em]">{title}</h1>
      {description ? <p className="text-base text-text-secondary">{description}</p> : null}
    </header>
  );
}
