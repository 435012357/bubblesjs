import { Spin } from 'antd';

const Loading = () => {
  return (
    <div className="flex justify-center items-center w-full h-100%">
      <Spin size="large" />
    </div>
  );
};

export default Loading;
