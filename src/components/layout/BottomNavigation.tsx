import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, CreditCard, User, MoreHorizontal, Calendar, Trophy, Settings, ClipboardList, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tapFeedback } = useHaptics();
  const { activeRole } = useUserRoles();
  const [moreOpen, setMoreOpen] = useState(false);

  // Primary navigation items (shown in bottom bar)
  const primaryItems: NavItem[] = [
    { label: 'Home', icon: Home, path: '/dashboard' },
    { label: 'Teams', icon: Users, path: '/teams' },
    { label: 'Cards', icon: CreditCard, path: '/sports-cards' },
    { label: 'Events', icon: Calendar, path: '/events' },
  ];

  // Secondary items for "More" menu
  const secondaryItems: NavItem[] = [
    { label: 'Sports', icon: Trophy, path: '/sports' },
    { label: 'Equipment', icon: Package, path: '/equipment' },
    { label: 'Registrations', icon: ClipboardList, path: '/registrations' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  // Role-specific items
  if (activeRole === 'coach') {
    secondaryItems.unshift({ label: 'Coach Dashboard', icon: Users, path: '/coach-dashboard' });
  } else if (activeRole === 'athlete') {
    secondaryItems.unshift({ label: 'My Dashboard', icon: User, path: '/athlete-dashboard' });
  } else if (activeRole === 'parent') {
    secondaryItems.unshift({ label: 'Parent Dashboard', icon: User, path: '/parent-dashboard' });
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    tapFeedback();
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16">
        {primaryItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] gap-1 transition-colors touch-manipulation',
              isActive(item.path)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <span className="absolute top-2 right-1/4 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
        
        {/* More button with sheet */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              onClick={() => tapFeedback()}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] gap-1 transition-colors touch-manipulation',
                moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-safe">
            <SheetHeader>
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-4 py-6">
              {secondaryItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-3 rounded-lg transition-colors touch-manipulation min-h-[80px]',
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

export default BottomNavigation;
