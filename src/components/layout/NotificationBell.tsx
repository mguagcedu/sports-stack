import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};

const typeColors = {
  info: 'text-blue-500 bg-blue-100',
  success: 'text-green-500 bg-green-100',
  warning: 'text-amber-500 bg-amber-100',
  error: 'text-red-500 bg-red-100',
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on reference type
    if (notification.reference_type === 'injury' || notification.reference_type === 'discipline') {
      navigate('/coach');
    } else if (notification.reference_type === 'depth_chart' || notification.reference_type === 'game_day') {
      navigate('/coach');
    } else if (notification.reference_type === 'equipment') {
      navigate('/equipment');
    } else if (notification.reference_type === 'team') {
      navigate('/teams');
    }
    
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <div>
            <h4 className="font-semibold">Notifications</h4>
            <p className="text-xs text-muted-foreground">
              {unreadCount === 0 ? 'All caught up!' : `${unreadCount} unread`}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => {
                const Icon = typeIcons[notification.type] || Info;
                const colorClass = typeColors[notification.type] || typeColors.info;
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 hover:bg-muted/50 cursor-pointer transition-colors relative group',
                      !notification.is_read && 'bg-primary/5'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                        colorClass
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm truncate',
                            !notification.is_read && 'font-medium'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                          {notification.category && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 10 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm"
              onClick={() => {
                setOpen(false);
                // Could navigate to a full notifications page
              }}
            >
              View all ({notifications.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}