import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/artists/$artistID/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/artists/$artistID/"!</div>
}
