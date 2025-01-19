import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, Wallet, LineChart, Bell, Settings, LucideIcon } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { MenuLink } from '../types';

const navigationItems: MenuLink[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: BarChart3,
    requiresAuth: true
  },
  {
    title: 'Portfolio',
    path: '/portfolio',
    icon: Wallet,
    requiresAuth: true,
    submenu: [
      { title: 'Overview', path: '/portfolio/overview' },
      { title: 'Transactions', path: '/portfolio/transactions' },
      { title: 'Analytics', path: '/portfolio/analytics' }
    ]
  },
  {
    title: 'Market',
    path: '/market',
    icon: LineChart
  },
  {
    title: 'Alerts',
    path: '/alerts',
    icon: Bell,
    requiresAuth: true
  },
  {
    title: 'Settings',
    path: '/settings',
    icon: Settings,
    requiresAuth: true
  }
];

export function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

  // Filter navigation items based on auth status
  const filteredItems = navigationItems.filter(
    item => !item.requiresAuth || isAuthenticated
  );

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const renderIcon = (Icon: LucideIcon | undefined) => {
    if (!Icon) return null;
    return <Icon size={20} className="mr-3" />;
  };

  return (
    <nav className="hidden lg:block w-64 bg-gray-800 min-h-screen">
      <div className="px-4 py-6">
        {filteredItems.map((item) => (
          <div key={item.path}>
            {/* Main menu item */}
            <div
              className={`mb-2 ${item.submenu ? 'cursor-pointer' : ''}`}
              onClick={() => item.submenu && setExpandedItem(
                expandedItem === item.path ? null : item.path
              )}
            >
              <Link
                to={item.path}
                className={`
                  flex items-center px-4 py-2 text-sm rounded-md
                  ${isActive(item.path)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                `}
              >
                {renderIcon(item.icon)}
                <span>{item.title}</span>
              </Link>
            </div>

            {/* Submenu items */}
            {item.submenu && expandedItem === item.path && (
              <div className="ml-8">
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.path}
                    to={subItem.path}
                    className={`
                      block px-4 py-2 text-sm rounded-md mb-1
                      ${isActive(subItem.path)
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}