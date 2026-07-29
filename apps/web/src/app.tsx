import { Button } from '@goal-tracker/ui/components/button';

export function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
      <section aria-labelledby="foundation-title" className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">Repository foundation</p>
        <h1 id="foundation-title" className="text-4xl font-semibold tracking-tight">
          Goal Tracker
        </h1>
        <p className="max-w-xl text-muted-foreground">
          The web application is ready for milestone-driven development.
        </p>
        <Button type="button">Foundation ready</Button>
      </section>
    </main>
  );
}
