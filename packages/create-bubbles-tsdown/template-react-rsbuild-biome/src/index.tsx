import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
import Loading from './components/Loading/PageLoading'
import '@/styles/index.scss'

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    <React.StrictMode>
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    </React.StrictMode>,
  )
}
