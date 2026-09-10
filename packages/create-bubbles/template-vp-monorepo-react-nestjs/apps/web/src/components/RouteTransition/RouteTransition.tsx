import { ViewTransition, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router'
import './RouteTransition.css'

export default function RouteTransition({ children }: PropsWithChildren) {
  const { pathname } = useLocation()

  return (
    <ViewTransition key={pathname} name="route-page" default="none" share="route-page">
      <div className="route-transition-page">{children}</div>
    </ViewTransition>
  )
}
