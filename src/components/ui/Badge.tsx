interface BadgeProps {
  count: number
  max?: number
}

export function Badge({ count, max = 99 }: BadgeProps) {
  if (count <= 0) return null
  return (
    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2563EB] px-1.5 text-[10px] font-semibold text-white leading-none">
      {count > max ? `${max}+` : count}
    </span>
  )
}
