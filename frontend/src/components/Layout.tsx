import React, { useState, useEffect } from 'react';
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
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        setMobileMenuVisible(false);
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
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/admin/points',
            label: '观察点管理',
            onClick: () => {
              navigate('/admin/points');
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/admin/routes',
            label: '活动路线管理',
            onClick: () => {
              navigate('/admin/routes');
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/admin/equipments',
            label: '器材清单管理',
            onClick: () => {
              navigate('/admin/equipments');
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/admin/cycles',
            label: '巡看周期设置',
            onClick: () => {
              navigate('/admin/cycles');
              setMobileMenuVisible(false);
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
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/inspector/records',
            label: '巡看记录',
            onClick: () => {
              navigate('/inspector/records');
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/inspector/new',
            label: '新建巡看记录',
            icon: <PlusOutlined />,
            onClick: () => {
              navigate('/inspector/new');
              setMobileMenuVisible(false);
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
              setMobileMenuVisible(false);
            },
          },
          {
            key: '/leader/new',
            label: '新建活动批次',
            icon: <PlusOutlined />,
            onClick: () => {
              navigate('/leader/new');
              setMobileMenuVisible(false);
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
          padding: isMobile ? '0 16px' : '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: 'white', fontSize: 20 }} />}
              onClick={() => setMobileMenuVisible(true)}
              style={{ marginRight: 12 }}
            />
          )}
          <div style={{ color: 'white', fontSize: isMobile ? 16 : 20, fontWeight: 'bold' }}>
            🦅 观鸟步道管理平台
          </div>
        </div>
        <Dropdown menu={userMenu}>
          <Button type="text" style={{ color: 'white' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {!isMobile && user?.full_name}
          </Button>
        </Dropdown>
      </Header>
      <AntLayout>
        {!isMobile && (
          <Sider width={220} style={{ background: '#fff' }}>
            {menuContent}
          </Sider>
        )}
        <Drawer
          placement="left"
          open={mobileMenuVisible}
          onClose={() => setMobileMenuVisible(false)}
          width={260}
          style={{ padding: 0 }}
          bodyStyle={{ padding: 0 }}
        >
          {menuContent}
        </Drawer>
        <Content style={{ padding: isMobile ? '16px' : '24px', background: '#f0f2f5', overflow: 'auto' }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
