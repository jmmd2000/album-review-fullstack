import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/albums/$albumID/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/albums/$albumID/"!</div>
}
