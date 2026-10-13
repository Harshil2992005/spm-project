import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState'

/** Lightweight placeholder so every sidebar route resolves while screens are built. */
export default function PlaceholderPage({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <section className="mx-auto max-w-2xl pt-6">
      <div className="panel flex flex-col items-center rounded-3xl p-6">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/12 text-brand-600">
          <Icon className="h-6 w-6" />
        </span>
        <EmptyState
          className="pt-2"
          title={`${title} is coming soon`}
          description={description}
          action={
            <Link
              to="/medicines"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Medicines
            </Link>
          }
        />
      </div>
    </section>
  )
}
