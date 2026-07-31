import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#components/button';
import { Calendar } from '#components/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '#components/popover';
import { cn } from '#lib/utils';

export function DatePicker({
  value,
  onChange,
  disabled,
  maxDate,
  id,
  label = 'Choose date',
  className,
}: {
  value?: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
  maxDate?: Date;
  id?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={label}
          className={cn('w-full justify-between bg-control font-normal', className)}
        >
          <span>{value ? format(value, 'PPP') : 'Choose date'}</span>
          <CalendarIcon className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[60] w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          disabled={maxDate ? { after: maxDate } : undefined}
          onSelect={(selected) => {
            if (!selected) return;
            onChange(selected);
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
