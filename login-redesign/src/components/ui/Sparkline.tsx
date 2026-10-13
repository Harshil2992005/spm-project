import { cn } from '../../lib/cn'

interface SparklineProps {
  data: number[]
  className?: string
  tone?: 'brand' | 'warning' | 'danger' | 'info'
  width?: number
  height?: number
}

const STROKE: Record<NonNullable<SparklineProps['tone']>, string> = {
  brand: '#4CAF50',
  warning: '#F5A524',
  danger: '#E5484D',
  info: '#3B82F6',
}

/**
 * Dependency-free SVG sparkline (no chart lib needed for a 40px trend).
 */
export default function Sparkline({
  data,
  className,
  tone = 'brand',
  width = 120,
  height = 36,
}: SparklineProps) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const stepX = width / (data.length - 1)
  const points = data.map((d, i) => [i * stepX, height - ((d - min) / span) * (height - 6) - 3] as const)

  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const color = STROKE[tone]
  const id = `spark-${tone}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      width={width}
      height={height}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.6" fill={color} />
    </svg>
  )
}
