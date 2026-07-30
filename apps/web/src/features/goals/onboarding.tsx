import { Button } from '@goal-tracker/ui/components/button';

export function OnboardingWelcome({
  onCreate,
  onBrowse,
}: {
  onCreate: () => void;
  onBrowse: () => void;
}) {
  return (
    <div className="flex min-h-[70dvh] flex-col justify-between py-4">
      <div className="space-y-6">
        <div className="space-y-3">
          <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight">
            Know where you stand, monthly.
          </h1>
          <p className="text-base text-muted-foreground">
            Create a goal, plan your months and always know what comes next.
          </p>
        </div>
        <ol className="space-y-4 text-[0.95rem] text-muted-foreground">
          <li className="flex gap-3">
            <span className="font-medium text-primary" data-date>
              01
            </span>
            <span>A target amount, or a list of things to buy.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-primary" data-date>
              02
            </span>
            <span>One or two contributions a month.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-primary" data-date>
              03
            </span>
            <span>Clear planning that updates as your items change.</span>
          </li>
        </ol>
      </div>
      <div className="space-y-3 pt-10">
        <Button type="button" className="w-full min-h-12" onClick={onCreate}>
          Create my first goal
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBrowse}>
          Look around first
        </Button>
      </div>
    </div>
  );
}
