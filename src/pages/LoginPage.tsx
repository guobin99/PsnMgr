import { useState } from 'react';
import { App, Button, Checkbox, Form, Input, Modal, Tag } from 'antd';
import { LockOutlined, SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '@/layouts/components/BrandLogo';
import { DEMO_PASSWORD, demoAccounts } from '@/config/roles';
import { useAuth } from '@/store/auth';
import { changePassword } from '@/services/auth';
import { readText, STORAGE_KEYS } from '@/utils/storage';

interface LoginFormValues {
  userName: string;
  password: string;
}

/** 演示账号区块仅在开启演示登录开关时展示（生产构建自动隐藏） */
const demoLoginEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

export default function LoginPage() {
  const [form] = Form.useForm<LoginFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(Boolean(readText(STORAGE_KEYS.loginUserName)));
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdForm] = Form.useForm<{ oldPassword: string; newPassword: string; confirmPassword: string }>();

  const from = (location.state as { from?: string } | null)?.from;

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const result = await login(values.userName, values.password, remember);
      message.success(`欢迎回来，${result.user.displayName}（${result.user.roleName}）`);
      if (result.mustChangePassword) {
        // 临时密码/重置密码后首次登录，强制修改密码（修改后后端会吊销令牌，需重新登录）
        pwdForm.resetFields();
        setPwdModalOpen(true);
        return;
      }
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '账号或密码错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const values = await pwdForm.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      pwdForm.setFields([{ name: 'confirmPassword', errors: ['两次输入的新密码不一致'] }]);
      return;
    }
    setPwdSaving(true);
    try {
      await changePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功，请使用新密码重新登录');
      setPwdModalOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '密码修改失败');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <BrandLogo />
        </div>
        <div className="login-brand-content">
          <span className="login-kicker">
            <SafetyCertificateOutlined />统一身份 · 统一数据 · 统一运营
          </span>
          <h1>
            一个平台，连接
            <br />
            人、卡、设备与场景
          </h1>
          <p>
            覆盖消费、考勤、门禁、订餐与访客业务，
            <br />
            让每一次识别都转化为高效管理。
          </p>
          <div className="login-feature-row">
            <div>
              <strong>8+</strong>
              <span>业务子系统</span>
            </div>
            <div>
              <strong>1</strong>
              <span>同源数据库</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>实时服务</span>
            </div>
          </div>
        </div>
        <div className="login-visual" aria-hidden="true">
          <div className="scan-frame">
            <UserOutlined />
            <i />
          </div>
          <span className="visual-chip chip-one">人脸识别</span>
          <span className="visual-chip chip-two">安全通行</span>
        </div>
        <footer>兼容 CS 业务基线 · 支持平滑过渡</footer>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-mobile-brand">
            <BrandLogo />
          </div>
          <div className="login-form-title">
            <span>WELCOME BACK</span>
            <h2>欢迎回来</h2>
            <p>登录人脸通 BS 一体化管理平台</p>
          </div>

          <Form<LoginFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ userName: readText(STORAGE_KEYS.loginUserName) ?? '' }}
            onFinish={onFinish}
          >
            <Form.Item name="userName" label="账号" rules={[{ required: true, message: '请输入登录账号' }]}>
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="请输入操作员账号"
                autoComplete="username"
                allowClear
              />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入登录密码' }]}>
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="请输入登录密码"
                autoComplete="current-password"
              />
            </Form.Item>
            <div className="login-options">
              <Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)}>
                记住登录状态
              </Checkbox>
              <Button type="link" onClick={() => message.info('请联系系统管理员重置密码')}>
                忘记密码？
              </Button>
            </div>
            <Button type="primary" htmlType="submit" size="large" block className="login-submit" loading={loading}>
              登录系统
            </Button>
          </Form>

          {demoLoginEnabled ? (
            <div className="login-demo-list">
              <span className="login-demo-caption">演示账号（密码 {DEMO_PASSWORD}，点击填入）</span>
              <div className="login-demo-tags">
                {demoAccounts.map((account) => (
                  <Tag
                    key={account.userName}
                    className="login-demo-tag"
                    onClick={() => form.setFieldsValue({ userName: account.userName, password: DEMO_PASSWORD })}
                  >
                    {account.displayName}
                  </Tag>
                ))}
              </div>
            </div>
          ) : null}

          <p className="login-security">
            <LockOutlined /> 请妥善保管账号，离开前及时退出系统
          </p>
        </div>
        <footer>© 2026 人脸通 · BS 管理平台</footer>
      </section>

      <Modal
        title="首次登录，请修改密码"
        open={pwdModalOpen}
        closable={false}
        maskClosable={false}
        keyboard={false}
        confirmLoading={pwdSaving}
        okText="修改并重新登录"
        cancelButtonProps={{ style: { display: 'none' } }}
        onOk={handleChangePassword}
      >
        <p style={{ marginBottom: 12, color: '#8793a3', fontSize: 12 }}>
          当前使用的是临时密码，修改成功后需使用新密码重新登录。
        </p>
        <Form form={pwdForm} layout="vertical">
          <Form.Item name="oldPassword" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password maxLength={20} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/, message: '8-20 位，需同时包含字母和数字' },
            ]}
          >
            <Input.Password maxLength={20} placeholder="8-20 位，包含字母和数字" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[{ required: true, message: '请再次输入新密码' }]}
          >
            <Input.Password maxLength={20} />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
}
