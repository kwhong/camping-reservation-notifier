import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  BellOutlined,
  HistoryOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import AvailableSites from './AvailableSites';
import UserSettings from '../Settings/UserSettings';
import NotificationLogs from '../Logs/NotificationLogs';
import ScrapingLogs from '../Logs/ScrapingLogs';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '가용 사이트',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '사용자 설정',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: '알람 목록',
    },
    {
      key: '/scraping-logs',
      icon: <HistoryOutlined />,
      label: '스크래핑 이력',
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
      onClick: async () => {
        await logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: collapsed ? '20px' : '18px',
          fontWeight: 'bold'
        }}>
          {collapsed ? '🏕️' : '🏕️ 캠핑 알림'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '18px', fontWeight: '500' }}>
            캠핑장 예약 알림 시스템
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ height: '64px' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {user?.email || '사용자'}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          <Routes>
            <Route path="/dashboard" element={<AvailableSites />} />
            <Route path="/settings" element={<UserSettings />} />
            <Route path="/notifications" element={<NotificationLogs />} />
            <Route path="/scraping-logs" element={<ScrapingLogs />} />
            <Route path="/" element={<AvailableSites />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
