// Role dashboard configurations
// Maps each role to their dashboard sections and accessible pages

export interface DashboardSection {
  title: string;
  description: string;
  path: string;
  icon: string;
  requiredRole?: string; // If set, shows access request instead of direct link
}

export interface RoleDashboardConfig {
  title: string;
  description: string;
  primaryPath: string;
  sections: DashboardSection[];
  quickStats?: string[];
}

export const ROLE_DASHBOARD_CONFIGS: Record<string, RoleDashboardConfig> = {
  // System-level admins
  system_admin: {
    title: 'System Admin Dashboard',
    description: 'Full system administration and oversight',
    primaryPath: '/',
    sections: [
      { title: 'Organizations', description: 'Manage all organizations', path: '/organizations', icon: 'Building2' },
      { title: 'Districts', description: 'Manage districts', path: '/districts', icon: 'Map' },
      { title: 'Schools', description: 'Manage schools', path: '/schools', icon: 'School' },
      { title: 'Users', description: 'User management', path: '/users', icon: 'Users' },
      { title: 'Teams', description: 'All teams', path: '/teams', icon: 'Users' },
      { title: 'Sports', description: 'Sport configurations', path: '/sports', icon: 'Trophy' },
      { title: 'Seasons', description: 'Season management', path: '/seasons', icon: 'Calendar' },
      { title: 'Equipment', description: 'Equipment inventory', path: '/equipment', icon: 'Package' },
      { title: 'Events', description: 'Event management', path: '/events', icon: 'Calendar' },
      { title: 'Financial Ledger', description: 'Financial overview', path: '/financial-ledger', icon: 'DollarSign' },
      { title: 'Audit Logs', description: 'System audit trail', path: '/audit-logs', icon: 'FileText' },
      { title: 'Governance', description: 'Sanctioning bodies', path: '/governance', icon: 'Shield' },
      { title: 'Import Data', description: 'Data imports', path: '/import', icon: 'Upload' },
      { title: 'Integrations', description: 'Third-party integrations', path: '/integrations', icon: 'Plug' },
      { title: 'Reports', description: 'System reports', path: '/reports', icon: 'BarChart3' },
      { title: 'Settings', description: 'System settings', path: '/settings', icon: 'Settings' },
    ],
    quickStats: ['organizations', 'schools', 'users', 'teams'],
  },

  superadmin: {
    title: 'Super Admin Dashboard',
    description: 'Complete system control and impersonation',
    primaryPath: '/',
    sections: [
      { title: 'All Features', description: 'Access everything', path: '/', icon: 'Crown' },
      { title: 'Impersonation', description: 'User impersonation', path: '/users', icon: 'UserCog' },
      { title: 'Permissions', description: 'Permission matrix', path: '/permissions', icon: 'Shield' },
      { title: 'System Validation', description: 'Validate system', path: '/system-validation', icon: 'CheckCircle' },
    ],
    quickStats: ['users', 'organizations', 'active_sessions'],
  },

  // Organization-level
  org_admin: {
    title: 'Organization Admin Dashboard',
    description: 'Manage your organization',
    primaryPath: '/',
    sections: [
      { title: 'Teams', description: 'Manage teams', path: '/teams', icon: 'Users' },
      { title: 'Users', description: 'Organization users', path: '/users', icon: 'Users' },
      { title: 'Events', description: 'Events calendar', path: '/events', icon: 'Calendar' },
      { title: 'Equipment', description: 'Equipment management', path: '/equipment', icon: 'Package' },
      { title: 'Registrations', description: 'Team registrations', path: '/registrations', icon: 'ClipboardList' },
      { title: 'Financial', description: 'Organization finances', path: '/financial-ledger', icon: 'DollarSign' },
      { title: 'Reports', description: 'Organization reports', path: '/reports', icon: 'BarChart3' },
    ],
    quickStats: ['teams', 'athletes', 'events', 'revenue'],
  },

  // Athletic department
  athletic_director: {
    title: 'Athletic Director Dashboard',
    description: 'Oversee athletic programs',
    primaryPath: '/',
    sections: [
      { title: 'All Teams', description: 'View all teams', path: '/teams', icon: 'Users' },
      { title: 'Coaches', description: 'Coach management', path: '/users', icon: 'Whistle' },
      { title: 'Events', description: 'Athletic events', path: '/events', icon: 'Calendar' },
      { title: 'Seasons', description: 'Season overview', path: '/seasons', icon: 'Calendar' },
      { title: 'Equipment', description: 'Athletic equipment', path: '/equipment', icon: 'Package' },
      { title: 'Budget', description: 'Athletic budget', path: '/financial-ledger', icon: 'DollarSign' },
      { title: 'Governance', description: 'Compliance', path: '/governance', icon: 'Shield' },
      { title: 'Approvals', description: 'Pending approvals', path: '/pending-approvals', icon: 'CheckCircle' },
    ],
    quickStats: ['teams', 'coaches', 'athletes', 'budget'],
  },

  // Coaching staff
  head_coach: {
    title: 'Head Coach Dashboard',
    description: 'Lead your team to victory',
    primaryPath: '/coach',
    sections: [
      { title: 'My Teams', description: 'Your teams', path: '/coach', icon: 'Trophy' },
      { title: 'Roster', description: 'Team roster', path: '/coach', icon: 'Users' },
      { title: 'Sports Cards', description: 'Team cards', path: '/sports-cards', icon: 'IdCard' },
      { title: 'Schedule', description: 'Team schedule', path: '/events', icon: 'Calendar' },
      { title: 'Attendance', description: 'Track attendance', path: '/coach', icon: 'ClipboardList' },
      { title: 'Equipment', description: 'Team equipment', path: '/equipment', icon: 'Package' },
    ],
    quickStats: ['roster_size', 'upcoming_games', 'attendance_rate'],
  },

  coach: {
    title: 'Coach Dashboard',
    description: 'Manage your team',
    primaryPath: '/coach',
    sections: [
      { title: 'My Teams', description: 'Your teams', path: '/coach', icon: 'Trophy' },
      { title: 'Sports Cards', description: 'Team cards', path: '/sports-cards', icon: 'IdCard' },
      { title: 'Schedule', description: 'Team schedule', path: '/events', icon: 'Calendar' },
      { title: 'Equipment', description: 'Team equipment', path: '/equipment', requiredRole: 'equipment_manager', icon: 'Package' },
    ],
    quickStats: ['roster_size', 'upcoming_games'],
  },

  assistant_coach: {
    title: 'Assistant Coach Dashboard',
    description: 'Support your team',
    primaryPath: '/coach',
    sections: [
      { title: 'My Teams', description: 'Your teams', path: '/coach', icon: 'Trophy' },
      { title: 'Sports Cards', description: 'Team cards', path: '/sports-cards', icon: 'IdCard' },
      { title: 'Schedule', description: 'Team schedule', path: '/events', icon: 'Calendar' },
    ],
    quickStats: ['roster_size', 'upcoming_games'],
  },

  // Team support
  team_manager: {
    title: 'Team Manager Dashboard',
    description: 'Support team operations',
    primaryPath: '/coach',
    sections: [
      { title: 'Team Roster', description: 'Manage roster', path: '/coach', icon: 'Users' },
      { title: 'Equipment', description: 'Team equipment', path: '/equipment', icon: 'Package' },
      { title: 'Schedule', description: 'Team schedule', path: '/events', icon: 'Calendar' },
      { title: 'Attendance', description: 'Track attendance', path: '/coach', icon: 'ClipboardList' },
    ],
    quickStats: ['roster_size', 'equipment_issued'],
  },

  trainer: {
    title: 'Trainer Dashboard',
    description: 'Athletic training and health',
    primaryPath: '/coach',
    sections: [
      { title: 'Athletes', description: 'Athlete health records', path: '/coach', icon: 'Users' },
      { title: 'Injuries', description: 'Injury tracking', path: '/coach', icon: 'Heart' },
      { title: 'Clearances', description: 'Medical clearances', path: '/pending-approvals', icon: 'CheckCircle' },
      { title: 'Equipment', description: 'Training equipment', path: '/equipment', requiredRole: 'equipment_manager', icon: 'Package' },
    ],
    quickStats: ['athletes', 'active_injuries', 'clearances_pending'],
  },

  scorekeeper: {
    title: 'Scorekeeper Dashboard',
    description: 'Game statistics and scoring',
    primaryPath: '/coach',
    sections: [
      { title: 'Team Roster', description: 'View players', path: '/coach', icon: 'Users' },
      { title: 'Live Games', description: 'Active games', path: '/events', icon: 'Play' },
      { title: 'Schedule', description: 'Game schedule', path: '/events', icon: 'Calendar' },
      { title: 'Stats', description: 'Game statistics', path: '/reports', icon: 'BarChart3' },
    ],
    quickStats: ['games_today', 'games_this_week'],
  },

  // Athletes and families
  athlete: {
    title: 'Athlete Dashboard',
    description: 'Your athletic journey',
    primaryPath: '/athlete',
    sections: [
      { title: 'My Teams', description: 'Your teams', path: '/athlete', icon: 'Trophy' },
      { title: 'Sports Cards', description: 'Your cards', path: '/sports-cards', icon: 'IdCard' },
      { title: 'Schedule', description: 'Your schedule', path: '/events', icon: 'Calendar' },
      { title: 'Achievements', description: 'Your achievements', path: '/athlete', icon: 'Medal' },
      { title: 'Equipment', description: 'My equipment', path: '/equipment', icon: 'Package' },
    ],
    quickStats: ['teams', 'upcoming_events', 'achievements'],
  },

  parent: {
    title: 'Parent Dashboard',
    description: 'Stay connected with your children\'s activities',
    primaryPath: '/parent',
    sections: [
      { title: 'My Children', description: 'Children profiles', path: '/parent', icon: 'Users' },
      { title: 'Schedule', description: 'Family calendar', path: '/events', icon: 'Calendar' },
      { title: 'Registrations', description: 'Registration status', path: '/registrations', icon: 'ClipboardList' },
      { title: 'Payments', description: 'Payment history', path: '/payments', icon: 'CreditCard' },
      { title: 'Volunteering', description: 'Volunteer opportunities', path: '/volunteering', icon: 'Heart' },
    ],
    quickStats: ['children', 'upcoming_events', 'pending_payments'],
  },

  guardian: {
    title: 'Guardian Dashboard',
    description: 'Support your athlete',
    primaryPath: '/parent',
    sections: [
      { title: 'My Athletes', description: 'Athletes you support', path: '/parent', icon: 'Users' },
      { title: 'Schedule', description: 'Event calendar', path: '/events', icon: 'Calendar' },
      { title: 'Registrations', description: 'Registration status', path: '/registrations', icon: 'ClipboardList' },
    ],
    quickStats: ['athletes', 'upcoming_events'],
  },

  // Administrative staff
  registrar: {
    title: 'Registrar Dashboard',
    description: 'Manage registrations and eligibility',
    primaryPath: '/registrations',
    sections: [
      { title: 'Registrations', description: 'All registrations', path: '/registrations', icon: 'ClipboardList' },
      { title: 'Pending Approvals', description: 'Awaiting action', path: '/pending-approvals', icon: 'Clock' },
      { title: 'Athletes', description: 'Athlete records', path: '/teams', icon: 'Users' },
      { title: 'Import Data', description: 'Bulk imports', path: '/import', icon: 'Upload' },
    ],
    quickStats: ['pending_registrations', 'approved_today', 'total_athletes'],
  },

  finance_admin: {
    title: 'Finance Admin Dashboard',
    description: 'Financial management and reporting',
    primaryPath: '/financial-ledger',
    sections: [
      { title: 'Ledger', description: 'Financial ledger', path: '/financial-ledger', icon: 'DollarSign' },
      { title: 'Payments', description: 'Payment tracking', path: '/payments', icon: 'CreditCard' },
      { title: 'Reports', description: 'Financial reports', path: '/reports', icon: 'BarChart3' },
      { title: 'Equipment Value', description: 'Asset tracking', path: '/equipment', icon: 'Package' },
    ],
    quickStats: ['revenue_mtd', 'expenses_mtd', 'outstanding_payments'],
  },

  finance_clerk: {
    title: 'Finance Clerk Dashboard',
    description: 'Process payments and transactions',
    primaryPath: '/payments',
    sections: [
      { title: 'Payments', description: 'Process payments', path: '/payments', icon: 'CreditCard' },
      { title: 'Ledger', description: 'View ledger', path: '/financial-ledger', requiredRole: 'finance_admin', icon: 'DollarSign' },
    ],
    quickStats: ['payments_today', 'pending_payments'],
  },

  // Equipment
  equipment_manager: {
    title: 'Equipment Manager Dashboard',
    description: 'Manage athletic equipment',
    primaryPath: '/equipment',
    sections: [
      { title: 'Inventory', description: 'Equipment inventory', path: '/equipment', icon: 'Package' },
      { title: 'Checkouts', description: 'Active checkouts', path: '/equipment', icon: 'ArrowRightLeft' },
      { title: 'Maintenance', description: 'Maintenance schedule', path: '/equipment', icon: 'Wrench' },
      { title: 'Reports', description: 'Equipment reports', path: '/reports', icon: 'BarChart3' },
    ],
    quickStats: ['total_items', 'checked_out', 'needs_maintenance'],
  },

  student_manager: {
    title: 'Student Manager Dashboard',
    description: 'Help manage your team',
    primaryPath: '/coach',
    sections: [
      { title: 'Team Roster', description: 'Team members', path: '/coach', icon: 'Users' },
      { title: 'Schedule', description: 'Team schedule', path: '/events', icon: 'Calendar' },
      { title: 'Attendance', description: 'Track attendance', path: '/coach', icon: 'ClipboardList' },
    ],
    quickStats: ['roster_size', 'upcoming_events'],
  },

  student_equipment_manager: {
    title: 'Student Equipment Manager Dashboard',
    description: 'Help manage team equipment',
    primaryPath: '/equipment',
    sections: [
      { title: 'Team Equipment', description: 'Your team\'s equipment', path: '/equipment', icon: 'Package' },
      { title: 'Checkouts', description: 'Equipment checkouts', path: '/equipment', icon: 'ArrowRightLeft' },
    ],
    quickStats: ['team_items', 'checked_out'],
  },

  // Event staff
  gate_staff: {
    title: 'Gate Staff Dashboard',
    description: 'Event entry and tickets',
    primaryPath: '/events',
    sections: [
      { title: 'Today\'s Events', description: 'Events today', path: '/events', icon: 'Calendar' },
      { title: 'Ticket Scanning', description: 'Scan tickets', path: '/events', icon: 'QrCode' },
    ],
    quickStats: ['events_today', 'tickets_scanned'],
  },

  // Viewer
  viewer: {
    title: 'Viewer Dashboard',
    description: 'View public information',
    primaryPath: '/',
    sections: [
      { title: 'Teams', description: 'View teams', path: '/teams', icon: 'Users' },
      { title: 'Events', description: 'Public events', path: '/events', icon: 'Calendar' },
      { title: 'Sports Cards', description: 'View cards', path: '/sports-cards', icon: 'IdCard' },
    ],
    quickStats: [],
  },

  // District roles
  district_owner: {
    title: 'District Owner Dashboard',
    description: 'Full district management',
    primaryPath: '/districts',
    sections: [
      { title: 'District Overview', description: 'Your district', path: '/districts', icon: 'Map' },
      { title: 'Schools', description: 'District schools', path: '/schools', icon: 'School' },
      { title: 'Users', description: 'District users', path: '/users', icon: 'Users' },
      { title: 'Governance', description: 'District policies', path: '/governance', icon: 'Shield' },
    ],
    quickStats: ['schools', 'students', 'teams'],
  },

  district_admin: {
    title: 'District Admin Dashboard',
    description: 'Administer district operations',
    primaryPath: '/districts',
    sections: [
      { title: 'Schools', description: 'Manage schools', path: '/schools', icon: 'School' },
      { title: 'Teams', description: 'District teams', path: '/teams', icon: 'Users' },
      { title: 'Events', description: 'District events', path: '/events', icon: 'Calendar' },
    ],
    quickStats: ['schools', 'teams', 'events'],
  },

  district_viewer: {
    title: 'District Viewer Dashboard',
    description: 'View district information',
    primaryPath: '/districts',
    sections: [
      { title: 'Schools', description: 'View schools', path: '/schools', icon: 'School' },
      { title: 'Teams', description: 'View teams', path: '/teams', icon: 'Users' },
    ],
    quickStats: ['schools', 'teams'],
  },

  // School roles
  school_owner: {
    title: 'School Owner Dashboard',
    description: 'Full school management',
    primaryPath: '/schools',
    sections: [
      { title: 'School Overview', description: 'Your school', path: '/schools', icon: 'School' },
      { title: 'Teams', description: 'School teams', path: '/teams', icon: 'Users' },
      { title: 'Staff', description: 'School staff', path: '/users', icon: 'Users' },
      { title: 'Equipment', description: 'School equipment', path: '/equipment', icon: 'Package' },
      { title: 'Budget', description: 'Athletic budget', path: '/financial-ledger', icon: 'DollarSign' },
    ],
    quickStats: ['teams', 'athletes', 'coaches', 'budget'],
  },

  school_admin: {
    title: 'School Admin Dashboard',
    description: 'Administer school athletics',
    primaryPath: '/schools',
    sections: [
      { title: 'Teams', description: 'Manage teams', path: '/teams', icon: 'Users' },
      { title: 'Events', description: 'School events', path: '/events', icon: 'Calendar' },
      { title: 'Registrations', description: 'Student registrations', path: '/registrations', icon: 'ClipboardList' },
    ],
    quickStats: ['teams', 'athletes', 'events'],
  },

  school_viewer: {
    title: 'School Viewer Dashboard',
    description: 'View school athletics',
    primaryPath: '/schools',
    sections: [
      { title: 'Teams', description: 'View teams', path: '/teams', icon: 'Users' },
      { title: 'Events', description: 'View events', path: '/events', icon: 'Calendar' },
    ],
    quickStats: ['teams', 'events'],
  },
};

// Get dashboard config for a user's primary role
export function getDashboardConfig(roles: string[]): RoleDashboardConfig {
  // Priority order for determining primary dashboard
  const rolePriority = [
    'superadmin', 'system_admin', 'org_admin', 'district_owner', 'school_owner',
    'athletic_director', 'head_coach', 'coach', 'assistant_coach',
    'equipment_manager', 'finance_admin', 'registrar', 'trainer',
    'team_manager', 'parent', 'guardian', 'athlete', 'viewer'
  ];

  for (const role of rolePriority) {
    if (roles.includes(role) && ROLE_DASHBOARD_CONFIGS[role]) {
      return ROLE_DASHBOARD_CONFIGS[role];
    }
  }

  // Default to viewer if no matching role
  return ROLE_DASHBOARD_CONFIGS['viewer'];
}
