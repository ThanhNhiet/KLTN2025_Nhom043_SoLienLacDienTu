import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import OTPConfirmPage from '../pages/auth/OTPConfirmPage';
import ChangePasswordPage from '../pages/auth/ChangePasswordPage';
import AccountDbPage from '../pages/admin/account/AccountsDashboardPage';
import ClazzListPage from '../pages/lecturer/clazz/ClazzListPage';
import SchedulePage from '../pages/lecturer/schedule/SchedulePage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AlertDbPage from '../pages/admin/alert/AlertDashboardPage';
import ChatDbPage from '../pages/admin/chat/ChatDashboardPage';
import CourseSectionSLPage from '../pages/admin/chat/CourseSectionSLPage';
import StatisticsMainPage from '../pages/admin/statistics/StatisticsMainPage';
import ProfileInfoPage from '../pages/lecturer/profile/ProfileInfoPage';
import StudentListWithScorePage from '../pages/lecturer/studentscrore/StudentListWithScorePage';
import AlertListPage from '../pages/lecturer/alert/AlertListPage';
import StudentsAttendancePage from '../pages/lecturer/attendance/StudentsAttendancePage';
import ChatMainPage from '../pages/chatfeature/ChatMainPage';
import ChatMainPageAD from '../pages/chatfeature/ChatMainPageAD';
import NotFoundPage from '../components/shared/NotFoundPage'
import ProfileADInfoPage from '../pages/admin/profile/ProfileInfoPage';
import WarningStudentsPage from '../pages/admin/alert/WarningStudentsPage';

const Router: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes - không cần bearer token */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/otp-confirm" element={<OTPConfirmPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        
        {/* Admin routes - cần bearer token và role admin */}
        <Route 
          path="/admin/accounts" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AccountDbPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/alerts" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AlertDbPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/chat/course-sections" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <CourseSectionSLPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/chats" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ChatDbPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/statistics"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <StatisticsMainPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/chat" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ChatMainPageAD />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/profile" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <ProfileADInfoPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/alerts/warning-students" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <WarningStudentsPage />
            </ProtectedRoute>
          }
        />

        {/* Lecturer routes - cần bearer token và role lecturer */}
        <Route 
          path="/lecturer/profile" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <ProfileInfoPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecturer/clazz" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <ClazzListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecturer/schedule" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <SchedulePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecturer/clazz/students/:course_section_id" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <StudentListWithScorePage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/lecturer/alerts" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <AlertListPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lecturer/clazz/students-attendance/:course_section_id" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <StudentsAttendancePage />
            </ProtectedRoute>
          }
        />

        {/* Chat feature route - cần bearer token và role lecturer */}
        <Route 
          path="/lecturer/chat" 
          element={
            <ProtectedRoute requiredRole="LECTURER">
              <ChatMainPage />
            </ProtectedRoute>
          } 
        />

        {/* Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;