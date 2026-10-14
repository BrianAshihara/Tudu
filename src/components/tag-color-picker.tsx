import { Check, Pipette } from "lucide-react"

import { TagDot } from "@/components/tag-pill"
import { isPresetColor, tagHex } from "@/lib/meta"
import { TAG_COLORS, type TagColor } from "@/lib/types"

export function TagColorPicker({ value, onChange }: { value: TagColor; onChange: (color: TagColor) => void }) {
  const custom = !isPresetColor(value)

  return (
    <div className="flex flex-col gap-2">
      <span className="px-0.5 text-[11px] font-semibold text-muted-foreground">Color</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {TAG_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color[0].toUpperCase() + color.slice(1)}
            onClick={() => onChange(color)}
            className="flex size-6 items-center justify-center rounded-full transition-transform duration-150 hover:scale-115 active:scale-95"
          >
            <TagDot tag={{ color }} className="flex size-5 items-center justify-center">
              {value === color && <Check className="size-3 text-white animate-in zoom-in-50 duration-150" strokeWidth={3} />}
            </TagDot>
          </button>
        ))}
        <label
          title="Custom color"
          className="relative flex size-6 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 hover:scale-115 active:scale-95"
        >
          <span
            className="flex size-5 items-center justify-center rounded-full"
            style={{
              background: custom
                ? value
                : "conic-gradient(#ff3b30, #ffcc00, #34c759, #007aff, #af52de, #ff3b30)",
            }}
          >
            {custom ? (
              <Check className="size-3 text-white animate-in zoom-in-50 duration-150" strokeWidth={3} />
            ) : (
              <Pipette className="size-2.5 text-white drop-shadow-sm" strokeWidth={2.5} />
            )}
          </span>
          <input
            type="color"
            value={tagHex(value)}
            onChange={(event) => onChange(event.target.value as TagColor)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )
}
