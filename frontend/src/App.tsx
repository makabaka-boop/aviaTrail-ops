import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Segments from './pages/admin/Segments';
import ObservationPoints from './pages/admin/ObservationPoints';
import AdminRoutes from './pages/admin/Routes';
import Equipments from './pages/admin/Equipments';
import Cycles from './pages/admin/Cycles';
import Pending from './pages/inspector/Pending';
import Records from './pages/inspector/Records';
import NewRecord from './pages/inspector/NewRecord';
import Batches from './pages/leader/Batches';
import NewBatch from './pages/leader/NewBatch';
import { isAuthenticated, hasRole } from './utils/auth';
import 'dayjs/locale/zh-cn';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

const RoleRoute: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  if (!hasRole(roles)) {
    message.error('您没有权限访问该页面');
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/segments"
            element={
              <RoleRoute roles={['管理员']}>
                <Segments />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/points"
            element={
              <RoleRoute roles={['管理员']}>
                <ObservationPoints />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/routes"
            element={
              <RoleRoute roles={['管理员']}>
                <AdminRoutes />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/equipments"
            element={
              <RoleRoute roles={['管理员']}>
                <Equipments />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/cycles"
            element={
              <RoleRoute roles={['管理员']}>
                <Cycles />
              </RoleRoute>
            }
          />
          <Route
            path="/inspector/pending"
            element={
              <RoleRoute roles={['巡看人员', '管理员']}>
                <Pending />
              </RoleRoute>
            }
          />
          <Route
            path="/inspector/records"
            element={
              <RoleRoute roles={['巡看人员', '管理员']}>
                <Records />
              </RoleRoute>
            }
          />
          <Route
            path="/inspector/new"
            element={
              <RoleRoute roles={['巡看人员', '管理员']}>
                <NewRecord />
              </RoleRoute>
            }
          />
          <Route
            path="/leader/batches"
            element={
              <RoleRoute roles={['活动领队', '管理员']}>
                <Batches />
              </RoleRoute>
            }
          />
          <Route
            path="/leader/new"
            element={
              <RoleRoute roles={['活动领队', '管理员']}>
                <NewBatch />
              </RoleRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
