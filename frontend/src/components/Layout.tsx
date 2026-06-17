import React from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  EyeOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout, hasRole } from '../utils/auth';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    const items = [];

    items.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
      onClick: () => navigate('/dashboard'),
    });

    if (hasRole(['管理员'])) {
      items.push({
        key: '/admin',
        icon: <ToolOutlined />,
        label: '系统管理',
        children: [
          {
            key: '/admin/segments',
            label: '步道分段管理',
            onClick: () => navigate('/admin/segments'),
          },
          {
            key: '/admin/points',
            label: '观察点管理',
            onClick: () => navigate('/admin/points'),
          },
          {
            key: '/admin/routes',
            label: '活动路线管理',
            onClick: () => navigate('/admin/routes'),
          },
          {
            key: '/admin/equipments',
            label: '器材清单管理',
            onClick: () => navigate('/admin/equipments'),
          },
          {
            key: '/admin/cycles',
            label: '巡看周期设置',
            onClick: () => navigate('/admin/cycles'),
          },
        ],
      });
    }

    if (hasRole(['巡看人员', '管理员'])) {
      items.push({
        key: '/inspector',
        icon: <EyeOutlined />,
        label: '巡看管理',
        children: [
          {
            key: '/inspector/pending',
            label: '待巡看路段',
            onClick: () => navigate('/inspector/pending'),
          },
          {
            key: '/inspector/records',
            label: '巡看记录',
            onClick: () => navigate('/inspector/records'),
          },
          {
            key: '/inspector/new',
            label: '新建巡看记录',
            icon: <PlusOutlined />,
            onClick: () => navigate('/inspector/new'),
          },
        ],
      });
    }

    if (hasRole(['活动领队', '管理员'])) {
      items.push({
        key: '/leader',
        icon: <TeamOutlined />,
        label: '活动管理',
        children: [
          {
            key: '/leader/batches',
            label: '活动批次',
            onClick: () => navigate('/leader/batches'),
          },
          {
            key: '/leader/new',
            label: '新建活动批次',
            icon: <PlusOutlined />,
            onClick: () => navigate('/leader/new'),
          },
        ],
      });
    }

    return items;
  };

  const userMenu = {
    items: [
      {
        key: 'user',
        icon: <UserOutlined />,
        label: `${user?.full_name} (${user?.role})`,
        disabled: true,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 24px',
        }}
      >
        <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
          🦅 观鸟步道管理平台
        </div>
        <Dropdown menu={userMenu}>
          <Button type="text" style={{ color: 'white' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {user?.full_name}
          </Button>
        </Dropdown>
      </Header>
      <AntLayout>
        <Sider width={220} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={getMenuItems()}
          />
        </Sider>
        <Content style={{ padding: '24px', background: '#f0f2f5' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
