import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
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
import { isAuthenticated } from './utils/auth';
import 'dayjs/locale/zh-cn';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
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
              <PrivateRoute>
                <Segments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/points"
            element={
              <PrivateRoute>
                <ObservationPoints />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/routes"
            element={
              <PrivateRoute>
                <AdminRoutes />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/equipments"
            element={
              <PrivateRoute>
                <Equipments />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/cycles"
            element={
              <PrivateRoute>
                <Cycles />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspector/pending"
            element={
              <PrivateRoute>
                <Pending />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspector/records"
            element={
              <PrivateRoute>
                <Records />
              </PrivateRoute>
            }
          />
          <Route
            path="/inspector/new"
            element={
              <PrivateRoute>
                <NewRecord />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader/batches"
            element={
              <PrivateRoute>
                <Batches />
              </PrivateRoute>
            }
          />
          <Route
            path="/leader/new"
            element={
              <PrivateRoute>
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
