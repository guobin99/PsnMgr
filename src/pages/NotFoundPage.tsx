import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="not-found-page">
      <Result
        status="404"
        title="页面不存在"
        subTitle="当前地址没有对应的功能页面，请从左侧导航重新进入。"
        extra={<Button type="primary" onClick={() => navigate('/dashboard')}>返回工作台</Button>}
      />
    </div>
  );
}
