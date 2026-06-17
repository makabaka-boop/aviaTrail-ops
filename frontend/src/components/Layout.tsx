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
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setCollapsed(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSider = () => {
    setCollapsed(!collapsed);
  };

  const getMenuItems = () => {
    const items = [];

    items.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '数据看板',
      onClick: () => {
        navigate('/dashboard');
        if (isMobile) setCollapsed(true);
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
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/admin/points',
            label: '观察点管理',
            onClick: () => {
              navigate('/admin/points');
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/admin/routes',
            label: '活动路线管理',
            onClick: () => {
              navigate('/admin/routes');
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/admin/equipments',
            label: '器材清单管理',
            onClick: () => {
              navigate('/admin/equipments');
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/admin/cycles',
            label: '巡看周期设置',
            onClick: () => {
              navigate('/admin/cycles');
              if (isMobile) setCollapsed(true);
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
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/inspector/records',
            label: '巡看记录',
            onClick: () => {
              navigate('/inspector/records');
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/inspector/new',
            label: '新建巡看记录',
            icon: <PlusOutlined />,
            onClick: () => {
              navigate('/inspector/new');
              if (isMobile) setCollapsed(true);
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
              if (isMobile) setCollapsed(true);
            },
          },
          {
            key: '/leader/new',
            label: '新建活动批次',
            icon: <PlusOutlined />,
            onClick: () => {
              navigate('/leader/new');
              if (isMobile) setCollapsed(true);
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

  return (
    <AntLayout style={{ minHeight: '100vh' }} className="main-layout">
      <Header
        className="layout-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#001529',
          padding: '0 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ color: 'white', fontSize: 20 }} />}
              onClick={toggleSider}
              style={{ marginRight: 8 }}
            />
          )}
          <div style={{ color: 'white', fontSize: isMobile ? '16px' : '20px', fontWeight: 'bold' }}>
            🦅 观鸟步道管理平台
          </div>
        </div>
        <Dropdown menu={userMenu}>
          <Button type="text" style={{ color: 'white' }}>
            <Avatar size={isMobile ? 'small' : 'default'} icon={<UserOutlined />} style={{ marginRight: 8 }} />
            {!isMobile && user?.full_name}
          </Button>
        </Dropdown>
      </Header>
      <AntLayout>
        {isMobile && !collapsed && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99,
            }}
            onClick={() => setCollapsed(true)}
          />
        )}
        <Sider
          width={220}
          collapsible
          collapsed={collapsed}
          trigger={null}
          style={{
            background: '#fff',
            position: isMobile ? 'fixed' : 'relative',
            left: 0,
            top: isMobile ? 64 : 0,
            bottom: 0,
            zIndex: 100,
            height: isMobile ? 'calc(100vh - 64px)' : 'auto',
            boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
          }}
          className="layout-sider"
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={getMenuItems()}
          />
        </Sider>
        <Content
          className="layout-content"
          style={{
            padding: isMobile ? '12px' : '24px',
            background: '#f0f2f5',
            marginLeft: isMobile && !collapsed ? 220 : 0,
            transition: 'margin-left 0.2s',
            overflowX: 'hidden',
          }}
        >
          <div className="content-wrapper">{children}</div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
