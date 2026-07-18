import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell rounded-2xl p-6 grid gap-3 mb-8 sm:p-10">
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-3 text-4xl font-bold text-[var(--sea-ink)] sm:text-4xl">
          Institutional Student Success Monitoring
        </h1>
        <p className="m-0 text-lg leading-8 text-[var(--sea-ink-soft)]">
          This Intelligent Student Success Platform dashboard combines institutional oversight, student
          risk signals, and class-level analytics in a single responsive
          interface. It is designed for both Admin and Staff users, with the
          same UI and different data scope.
        </p>
      </section>
    </main>
  )
}
