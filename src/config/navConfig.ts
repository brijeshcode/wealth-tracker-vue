export interface NavItem {
  label: string
  icon: string
  to?: string
  children?: NavItem[]
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'layout-dashboard', to: '/dashboard' },
  {
    label: 'Investments',
    icon: 'briefcase',
    children: [
      { label: 'Fixed Deposits', icon: 'landmark', to: '/fd' },
      { label: 'Stocks', icon: 'trending-up', to: '/stocks' },
      { label: 'Mutual Funds', icon: 'pie-chart', to: '/mf' },
    ],
  },
  { label: 'Income', icon: 'banknote', to: '/income' },
  { label: 'Maturities', icon: 'calendar-clock', to: '/maturities' },
  { label: 'Import', icon: 'upload', to: '/import' },
]
