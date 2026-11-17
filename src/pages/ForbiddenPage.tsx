import { Button, Result, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { describePermission } from '@/utils/permission';

interface ForbiddenPageProps {
  required?: string;
  from?: string;
}

/** 403 结果页：保留主框架，展示所需权限与返回入口 */
export default function ForbiddenPage({ required, from }: ForbiddenPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="forbidden-page">
      <Result
        status="403"
        title="无权限访问该页面"
        subTitle={
          <Space direction="vertical" size={6} style={{ maxWidth: 520 }}>
            <span>
              当前账号{user ? `（${user.displayName} · ${user.roleName}）` : ''}没有该页面的访问权限，请联系系统管理员在「系统管理 · 角色管理」中分配。
            </span>
            {required ? (
              <span>
                所需权限：<Tag color="red">{describePermission(required)}</Tag>
                <Tag>{required}</Tag>
              </span>
            ) : null}
            {from ? <span className="forbidden-from">来源地址：{from}</span> : null}
          </Space>
        }
        extra={
          <Space>
            {from ? <Button onClick={() => navigate(-1)}>返回上一页</Button> : null}
            <Button type="primary" onClick={() => navigate('/dashboard', { replace: true })}>
              返回工作台
            </Button>
          </Space>
        }
      />
    </div>
  );
}
