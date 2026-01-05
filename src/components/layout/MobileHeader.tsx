import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useHaptics } from '@/hooks/useHaptics';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import sportsStackLogo from '@/assets/sports-stack-logo.png';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onMenuClick?: () => void;
}

export function MobileHeader({ title = 'Sports Stack', showBackButton, onMenuClick }: MobileHeaderProps) {
  const { user, signOut } = useAuth();
  const { activeRole } = useUserRoles();
  const { tapFeedback } = useHaptics();
  const navigate = useNavigate();

  const getInitials = () => {
    if (!user?.email) return 'U';
    const parts = user.email.split('@')[0].split(/[._-]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getRoleBadgeColor = () => {
    switch (activeRole) {
      case 'district_admin':
      case 'school_admin': return 'bg-destructive';
      case 'coach': return 'bg-primary';
      case 'athlete': return 'bg-success';
      case 'parent': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const handleSignOut = async () => {
    tapFeedback();
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-top">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left: Logo/Menu */}
        <div className="flex items-center gap-3">
          {onMenuClick ? (
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="touch-manipulation">
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <img src={sportsStackLogo} alt="Sports Stack" className="h-8 w-auto" />
          )}
          <span className="font-semibold text-foreground truncate max-w-[150px]">{title}</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <NotificationCenter />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative touch-manipulation">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getRoleBadgeColor()}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground capitalize">{activeRole}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { tapFeedback(); navigate('/settings'); }}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { tapFeedback(); navigate('/settings'); }}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default MobileHeader;
