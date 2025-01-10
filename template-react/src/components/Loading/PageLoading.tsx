import { Spin } from 'antd';

const Loading = () => {
  return (
    <div className="flex justify-center items-center w-100vw h-100vh bg-red">
      <Spin size="large" />
    </div>
  );
};

export default Loading;
