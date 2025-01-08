import { use, useRef } from 'react';
import './App.css';

// const getData: () => Promise<string> = () => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve('data rsbuild');
//     }, 1000);
//   });
// };

const App = () => {
  const a = useRef(null);
  return (
    <div className="content">
      <h1>我的应用程序</h1>
      <title>我的应用程序</title>
      <meta name="author" content="Josh" />
      <link rel="author" href="https://twitter.com/joshcstory/" />
      <meta name="keywords" content="我的应用程序" />
      <p>{result.value}</p>
      <h1>“1111”</h1>
      <p>Start building amazing things with Rsbuild.</p>
    </div>
  );
};

export default App;
