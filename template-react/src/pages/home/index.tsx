import { use } from 'react';

const fetchData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          {
            id: 1,
            title: 'Album 1',
          },
          {
            id: 2,
            title: 'Album 2',
          },
        ],
      });
    }, 1000);
  });
};

const Home = () => {
  return <h1>111</h1>;
};

export default Home;
