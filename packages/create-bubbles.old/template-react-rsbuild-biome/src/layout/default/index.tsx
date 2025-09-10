import { Outlet } from 'react-router'
const Layout = () => {
  return (
    <div className="w-full">
      <Outlet />
    </div>
  )
}

export default memo(Layout)
