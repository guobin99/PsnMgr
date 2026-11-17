import { useState } from 'react';
import { App, Avatar, Button, Dropdown, Form, Input, Modal, Space } from 'antd';
import {
  DownOutlined,
  LockOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/store/auth';

function avatarText(displayName: string): string {
  const parts = displayName.split(/[-·\s]/).filter(Boolean);
  return (parts[parts.length - 1] ?? displayName).charAt(0);
}

/** 用户菜单：头像、姓名、角色标签与账号相关动作 */
export default function UserMenu() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { user, logout } = useAuth();
  const { has } = usePermission();
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (!user) return null;

  const onMenuClick = ({ key }: { key: string }) => {
    if (key === 'profile') setProfileOpen(true);
    if (key === 'password') setPasswordOpen(true);
    if (key === 'settings') navigate('/system/param');
    if (key === 'logout') {
      modal.confirm({
        title: '确认退出登录？',
        content: '退出后需要重新验证身份才能进入管理平台。',
        okText: '退出登录',
        cancelText: '取消',
        onOk: async () => {
          await logout();
          navigate('/login', { replace: true });
        },
      });
    }
  };

  const items = [
    { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
    { key: 'password', icon: <LockOutlined />, label: '修改密码' },
    ...(has('system:param:view') ? [{ key: 'settings', icon: <SettingOutlined />, label: '系统设置' }] : []),
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  return (
    <>
      <Dropdown trigger={['click']} placement="bottomRight" menu={{ items, onClick: onMenuClick }}>
        <button className="user-entry">
          <Avatar size={36} className="user-avatar">
            {avatarText(user.displayName)}
          </Avatar>
          <span className="user-summary">
            <strong>{user.displayName}</strong>
            <small>{user.roleName}</small>
          </span>
          <DownOutlined className="user-chevron" />
        </button>
      </Dropdown>

      <Modal
        open={profileOpen}
        onCancel={() => setProfileOpen(false)}
        footer={<Button type="primary" onClick={() => setProfileOpen(false)}>知道了</Button>}
        title="个人信息"
      >
        <div className="profile-card">
          <Avatar size={64} className="user-avatar">
            {avatarText(user.displayName)}
          </Avatar>
          <div>
            <h3>{user.displayName}</h3>
            <p>
              {user.deptName} · {user.roleName}
            </p>
          </div>
        </div>
        <div className="profile-details">
          <div>
            <span>用户编号</span>
            <strong>{user.userId}</strong>
          </div>
          <div>
            <span>登录账号</span>
            <strong>{user.userName}</strong>
          </div>
          <div>
            <span>角色编号</span>
            <strong>{user.roleNo}</strong>
          </div>
          <div>
            <span>权限范围</span>
            <strong>{user.permissions.includes('*') ? '全部权限' : `${user.permissions.length} 项授权`}</strong>
          </div>
        </div>
      </Modal>

      <Modal open={passwordOpen} onCancel={() => setPasswordOpen(false)} footer={null} title="修改密码" destroyOnClose>
        <Form
          layout="vertical"
          onFinish={() => {
            setPasswordOpen(false);
            message.success('密码修改成功（演示）');
          }}
        >
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="至少 6 位，建议包含数字与字母" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || getFieldValue('newPassword') === value
                    ? Promise.resolve()
                    : Promise.reject(new Error('两次输入的密码不一致')),
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>
          <Space className="modal-form-actions">
            <Button onClick={() => setPasswordOpen(false)}>取消</Button>
            <Button type="primary" htmlType="submit">
              确认修改
            </Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
