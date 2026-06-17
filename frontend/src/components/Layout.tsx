import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button } from 'antd';
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
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
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

  const handleMenuClick = () => {
    if (isMobile) {
      setCollapsed(true);
    }
  };

  const menuItems = getMenuItems().map(item => ({
    ...item,
    onClick: () => {
      item.onClick?.();
      handleMenuClick();
    },
    children: item.children?.map(child => ({
      ...child,
      onClick: () => {
        child.onClick?.();
        handleMenuClick();
      },
    })),
  }));

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: isMobile ? '0 12px' : '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: 'white', fontSize: 20 }} />}
              onClick={() => setCollapsed(!collapsed)}
            />
          )}
          <div style={{ color: 'white', fontSize: isMobile ? 16 : '20px', fontWeight: 'bold' }}>
            🦅 观鸟步道管理平台
          </div>
        </div>
        <Dropdown menu={userMenu}>
          <Button type="text" style={{ color: 'white' }}>
            <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} size={isMobile ? 'small' : 'default'} />
            {!isMobile && user?.full_name}
          </Button>
        </Dropdown>
      </Header>
      <AntLayout>
        <Sider
          width={220}
          collapsed={collapsed}
          collapsible={!isMobile}
          trigger={null}
          style={{ background: '#fff' }}
          className={isMobile ? 'mobile-sider' : ''}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Content
          style={{
            padding: isMobile ? '12px' : '24px',
            background: '#f0f2f5',
            overflowX: 'hidden',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
