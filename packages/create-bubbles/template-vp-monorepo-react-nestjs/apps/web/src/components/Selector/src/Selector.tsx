import { ProTable, type ParamsType } from '@ant-design/pro-components'
import { Alert, Button, Flex, Modal, Tag, Typography } from 'antd'
import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { SelectorSelection } from './SelectorSelection'
import type { SelectorProps } from './SelectorTypes'

export default function Selector<
  T extends object,
  Params extends ParamsType = ParamsType,
  ValueType = 'text',
>({
  ref,
  title,
  rowKey,
  request,
  multiple = false,
  onChange,
  requestByKeys,
  labelRender,
  onTableChange,
  getCheckboxProps,
  modalProps,
  onLoad,
  onRequestError,
  pagination,
  scroll,
  ...tableProps
}: SelectorProps<T, Params, ValueType>) {
  const [session, setSession] = useState<{ id: number; selection: SelectorSelection<T> }>()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string>()
  const sessionId = useRef(0)
  const pendingId = useRef<number | null>(null)

  const hide = () => {
    sessionId.current += 1
    pendingId.current = null
    setSession(undefined)
    setConfirming(false)
    setError(undefined)
  }

  useEffect(
    () => () => {
      // 关闭、重开或卸载后，旧会话的异步补查不能提交到新会话。
      sessionId.current += 1
    },
    [],
  )

  useImperativeHandle(ref, () => ({
    show: (options = {}) => {
      const selection = new SelectorSelection<T>({ ...options, rowKey, multiple })
      const id = ++sessionId.current
      pendingId.current = null
      setConfirming(false)
      setError(undefined)
      setSession({ id, selection })
    },
    hide,
  }))

  const changeSelection = (selection: SelectorSelection<T>) => {
    if (!session || pendingId.current !== null || session.id !== sessionId.current) return
    setSession({ ...session, selection })
    setError(undefined)
  }

  const confirm = async () => {
    if (!session || pendingId.current !== null) return
    const { id, selection } = session
    pendingId.current = id
    setConfirming(true)
    setError(undefined)
    try {
      const resolved = await selection.resolve(requestByKeys)
      if (sessionId.current !== id) return
      await onChange([...resolved.value], resolved.rows)
      if (sessionId.current === id) hide()
    } catch (cause) {
      if (sessionId.current === id) {
        setError(cause instanceof Error ? cause.message : '确认选择失败，请重试')
      }
    } finally {
      if (sessionId.current === id) {
        pendingId.current = null
        setConfirming(false)
      }
    }
  }

  return (
    <Modal
      width={960}
      okText="确定"
      cancelText="取消"
      {...modalProps}
      title={title}
      open={!!session}
      destroyOnHidden
      onCancel={hide}
      onOk={() => void confirm()}
      confirmLoading={confirming}
      cancelButtonProps={{ disabled: confirming }}
      closable={!confirming}
      keyboard={!confirming}
      maskClosable={!confirming}
    >
      {session && (
        <>
          <Flex align="center" justify="space-between">
            <Typography.Text>已选择 {session.selection.value.length} 项</Typography.Text>
            <Button
              type="link"
              disabled={confirming || !session.selection.value.length}
              onClick={() => changeSelection(session.selection.select({ value: [] }))}
            >
              清空选择
            </Button>
          </Flex>
          <Flex wrap gap={4} style={{ maxHeight: 96, overflowY: 'auto', marginBottom: 12 }}>
            {session.selection.value.map((key) => {
              const row = session.selection.get(key)
              return (
                <Tag
                  key={`${typeof key}:${key}`}
                  closable={!confirming}
                  onClose={(event) => {
                    event.preventDefault()
                    changeSelection(
                      session.selection.select({
                        value: session.selection.value.filter((value) => value !== key),
                      }),
                    )
                  }}
                >
                  {row && labelRender ? labelRender(row) : String(key)}
                </Tag>
              )
            })}
          </Flex>
          {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 12 }} />}
          <ProTable<T, Params, ValueType>
            key={session.id}
            search={{ labelWidth: 'auto' }}
            cardProps={false}
            options={{ reload: true, density: false, setting: false }}
            {...tableProps}
            rowKey={(row) => session.selection.keyOf(row)}
            request={request}
            onChange={onTableChange}
            editable={undefined}
            dataSource={undefined}
            defaultData={undefined}
            pagination={
              pagination === false
                ? false
                : { defaultPageSize: 10, showSizeChanger: true, ...pagination }
            }
            scroll={{ x: 'max-content', y: 360, ...scroll }}
            tableAlertRender={false}
            tableAlertOptionRender={false}
            onLoad={(rows) => {
              if (session.id !== sessionId.current) return
              setError(undefined)
              setSession((current) =>
                current?.id === session.id
                  ? { ...current, selection: current.selection.remember(rows) }
                  : current,
              )
              onLoad?.(rows)
            }}
            onRequestError={(cause) => {
              if (session.id !== sessionId.current) return
              setError(cause.message || '加载选择数据失败，请刷新重试')
              onRequestError?.(cause)
            }}
            rowSelection={{
              type: session.selection.multiple ? 'checkbox' : 'radio',
              preserveSelectedRowKeys: true,
              selectedRowKeys: session.selection.value,
              getCheckboxProps: (row) => {
                const checkboxProps = getCheckboxProps?.(row)
                return { ...checkboxProps, disabled: confirming || checkboxProps?.disabled }
              },
              onChange: (keys, rows) =>
                changeSelection(session.selection.select({ value: keys, rows })),
            }}
          />
        </>
      )}
    </Modal>
  )
}
