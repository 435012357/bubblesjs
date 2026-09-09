# DraftProTable

基于 `FullHeightProTable`，在工具栏右侧的刷新、列设置图标旁加入“草稿箱”图标，使用带弧形开口的收纳盒轮廓。图标右上角通过小号角标显示草稿数量，数量为 0 或未提供时隐藏，超过 99 显示 `99+`，不显示 Tooltip。默认显示列表，点击图标后以主题色图标和浅色背景高亮选中并显示草稿，再次点击取消选中、回到列表。沿用 ProTable 原生表头和表体滚动，分页位于底部。

新增参数：

| 参数           | 说明                                                         |
| -------------- | ------------------------------------------------------------ |
| `view`         | 当前视图：`list` 或 `draft`，页面初始设为 `list`             |
| `onViewChange` | 切换视图，由业务页面更新数据、重置分页和选择项               |
| `draftCount`   | 草稿总数，可选；右上角角标显示，0 时隐藏，超过 99 显示 `99+` |
| `draftHint`    | 草稿提示，默认“草稿提交后进入列表”，传 `false` 可隐藏        |

其他参数沿用 `ProTableProps`，包括泛型、`request`、`params`、`actionRef`、`columns`、`pagination`、`scroll`、`headerTitle`、`toolBarRender` 等。组件通过 `optionsRender` 将草稿图标加入原生设置区，业务操作沿用 ProTable 的优先级，`toolbar.actions` 优先于 `toolBarRender`。

调用方提供 `optionsRender` 时保留其返回的工具项；提供 `toolbar.settings` 时，草稿图标放在自定义工具项之前。`options={false}` 会随原生设置区隐藏草稿入口，但显式提供 `toolbar.settings` 时仍按该配置显示。

```tsx
const [view, setView] = useState<DraftTableView>('list')

<DraftProTable<Project, ProjectQuery>
  view={view}
  onViewChange={changeView}
  draftCount={draftCount}
  columns={columns}
  actionRef={actionRef}
  params={{ view }}
  request={requestProjects}
/>
```

组件只负责 UI，不会自动添加请求参数、过滤数据、保存草稿或判断权限。使用 `request` 时，通过 `params` 带上当前视图；业务页面负责在切换时重置分页、选择项和搜索条件。

示例路由：`/examples/pro-table/draft`。示例使用当前浏览器的本地存储和固定演示用户；真实系统的草稿持久化及可见权限应由后端处理。示例中草稿允许字段不完整，提交时校验必填项，并沿用草稿编号转为正式项目。已提交项目编辑后直接保存。
