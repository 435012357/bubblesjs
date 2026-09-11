import './RouteTransition.css'

/** 只为已提交的新路由播放整页滑动，忽略同一路由的加载完成及异步更新。 */
export default function RouteTransition({ children }: PropsWithChildren) {
  const { key: locationKey } = useLocation()
  const previousLocationKey = useRef(locationKey)

  // onUpdate 先于 passive effect 执行；无动画的同步导航也需要更新基准。
  useEffect(() => {
    previousLocationKey.current = locationKey
  }, [locationKey])

  /** 同一导航只保留首次滑动，取消页内更新产生的整页快照动画。 */
  function handleUpdate() {
    if (previousLocationKey.current !== locationKey) {
      previousLocationKey.current = locationKey
      return
    }

    for (const animation of document.documentElement.getAnimations({ subtree: true })) {
      const effect = animation.effect
      if (
        effect instanceof KeyframeEffect &&
        /^::view-transition-(group|image-pair|old|new)\(route-page\)$/.test(
          effect.pseudoElement ?? '',
        )
      ) {
        animation.cancel()
      }
    }
  }

  return (
    <ReactViewTransition
      name="route-page"
      default="none"
      update="route-page"
      onUpdate={handleUpdate}
    >
      <div className="route-transition-page">{children ?? <Outlet />}</div>
    </ReactViewTransition>
  )
}
