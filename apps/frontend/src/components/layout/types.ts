import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface LayoutProps {
  children: ReactNode;
}

export interface MenuLink {
  title: string;
  path: string;
  icon?: LucideIcon;
  submenu?: MenuLink[];
  requiresAuth?: boolean;
}

export interface BreadcrumbItem {
  title: string;
  path: string;
}
