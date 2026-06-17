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

const PrivateRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  if (roles && roles.length > 0 && !hasRole(roles)) {
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
              <PrivateRoute roles={['管理员']}>
                <Segments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/points"
            element={
              <PrivateRoute roles={['管理员']}>
                <ObservationPoints />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/routes"
            element={
              <PrivateRoute roles={['管理员']}>
                <AdminRoutes />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/equipments"
            element={
              <PrivateRoute roles={['管理员']}>
                <Equipments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/cycles"
            element={
              <PrivateRoute roles={['管理员']}>
                <Cycles />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspector/pending"
            element={
              <PrivateRoute roles={['巡看人员', '管理员']}>
                <Pending />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspector/records"
            element={
              <PrivateRoute roles={['巡看人员', '管理员']}>
                <Records />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspector/new"
            element={
              <PrivateRoute roles={['巡看人员', '管理员']}>
                <NewRecord />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader/batches"
            element={
              <PrivateRoute roles={['活动领队', '管理员']}>
                <Batches />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader/new"
            element={
              <PrivateRoute roles={['活动领队', '管理员']}>
                <NewBatch />
              </PrivateRoute>
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
