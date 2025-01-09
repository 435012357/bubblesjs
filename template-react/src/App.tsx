import { useRef } from 'react'
import './App.css'

const App = () => {
  const a = useRef(null)
  return (
    <div className=" content text-center bg-green">
      <h1>我的应用程序</h1>
      <title>我的应用程序1</title>
      <meta name="author" content="Josh" />
      <link rel="author" href="https://twitter.com/joshcstory/" />
      <link
        rel="shortcut icon"
        href="https://www.baidu.com/favicon.ico"
        type="image/x-icon"
      />
      <meta name="keywords" content="我的应用程序1" />
      <p className="text-white">1231</p>
      <h1 className="text-orange bg-pink text-white">“1111221”</h1>
      <p>Start building amazing things with Rsbuild.</p>
    </div>
  )
}

export default App
