import { cn } from "@/lib/utils"

interface Option<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  className?: string
}) {
  return (
    <div className={cn("inline-flex h-7 items-center rounded-md bg-black/6 p-0.5 dark:bg-white/8", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-6 items-center justify-center gap-1.5 rounded-[5px] px-2.5 text-[12px] font-medium text-muted-foreground transition-colors",
            value === option.value
              ? "bg-background text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.15)] dark:bg-white/16"
              : "hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
