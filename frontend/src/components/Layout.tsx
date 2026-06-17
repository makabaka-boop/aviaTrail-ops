import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  EyeOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
  LogoutOutlined,
  PlusOutlined,
  MenuOutlined,
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);

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
      onClick: () => {
        navigate('/dashboard');
        setDrawerVisible(false);
      },
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
            onClick: () => {
              navigate('/admin/segments');
              setDrawerVisible(false);
            },
          },
          {
            key: '/admin/points',
            label: '观察点管理',
            onClick: () => {
              navigate('/admin/points');
              setDrawerVisible(false);
            },
          },
          {
            key: '/admin/routes',
            label: '活动路线管理',
            onClick: () => {
              navigate('/admin/routes');
              setDrawerVisible(false);
            },
          },
          {
            key: '/admin/equipments',
            label: '器材清单管理',
            onClick: () => {
              navigate('/admin/equipments');
              setDrawerVisible(false);
            },
          },
          {
            key: '/admin/cycles',
            label: '巡看周期设置',
            onClick: () => {
              navigate('/admin/cycles');
              setDrawerVisible(false);
            },
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
            onClick: () => {
              navigate('/inspector/pending');
              setDrawerVisible(false);
            },
          },
          {
            key: '/inspector/records',
            label: '巡看记录',
            onClick: () => {
              navigate('/inspector/records');
              setDrawerVisible(false);
            },
          },
          {
            key: '/inspector/new',
            label: '新建巡看记录',
            icon: <PlusOutlined />,
            onClick: () => {
              navigate('/inspector/new');
              setDrawerVisible(false);
            },
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
            onClick: () => {
              navigate('/leader/batches');
              setDrawerVisible(false);
            },
          },
          {
            key: '/leader/new',
            label: '新建活动批次',
            icon: <PlusOutlined />,
            onClick: () => {
              navigate('/leader/new');
              setDrawerVisible(false);
            },
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

  const menuContent = (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      style={{ height: '100%', borderRight: 0 }}
      items={getMenuItems()}
    />
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{ color: 'white', marginRight: 12, display: 'none' }}
            className="mobile-menu-btn"
          />
          <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            🦅 观鸟步道管理平台
          </div>
        </div>
        <Dropdown menu={userMenu}>
          <Button type="text" style={{ color: 'white' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            <span className="user-name-text">{user?.full_name}</span>
          </Button>
        </Dropdown>
      </Header>
      <AntLayout>
        <Sider
          width={220}
          collapsible
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          breakpoint="lg"
          collapsedWidth={0}
          className="desktop-sider"
          style={{ background: '#fff' }}
        >
          {menuContent}
        </Sider>
        <Drawer
          placement="left"
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          width={256}
          className="mobile-drawer"
          styles={{ body: { padding: 0 } }}
        >
          {menuContent}
        </Drawer>
        <Content style={{ padding: '24px', background: '#f0f2f5', overflowX: 'hidden' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
