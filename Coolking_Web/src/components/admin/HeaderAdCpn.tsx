import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import logoImg from '../../assets/img/logo.png';
import noImage from '../../assets/img/no-image.jpg';

const HeaderAdCpn: React.FC = () => {
  const { logout } = useAuth();
  const admin_name = localStorage.getItem('admin_name');
  const admin_avatar_url = localStorage.getItem('admin_avatar_url');

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img src={logoImg} alt="CoolKing Logo" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-blue-600">CoolKing</span>
            </div>

            <nav className="hidden md:flex space-x-6">
              <a
                href="/admin/accounts"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Tài khoản
              </a>
              <a
                href="/admin/chats"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Đoạn Chat
              </a>
              <a
                href="/admin/alerts"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Thông báo
              </a>
              <a
                href="/admin/statistics"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Thống kê
              </a>
              <a
                href="/admin/chat"
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                Nhắn tin
              </a>
            </nav>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            <a
              href="/admin/profile"
              className="hidden sm:flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group cursor-pointer"
            >
              {admin_avatar_url && (
                <img
                  src={admin_avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = noImage;
                  }}
                />
              )}
              <span className="text-gray-700 text-sm font-medium group-hover:text-blue-600 transition-colors duration-200">
                {admin_name || 'Quản trị viên'}
              </span>
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdCpn;
