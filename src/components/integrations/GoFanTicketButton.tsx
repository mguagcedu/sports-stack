import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, ExternalLink } from 'lucide-react';
import { generateEventTicketUrl } from '@/lib/integrations';

interface GoFanTicketButtonProps {
  eventTicketUrl?: string | null;
  schoolGoFanUrl?: string | null;
  schoolGoFanId?: string | null;
  enabled?: boolean;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  showBadge?: boolean;
}

export function GoFanTicketButton({
  eventTicketUrl,
  schoolGoFanUrl,
  schoolGoFanId,
  enabled = true,
  size = 'default',
  variant = 'default',
  showBadge = true,
}: GoFanTicketButtonProps) {
  if (!enabled) return null;

  const ticketUrl = generateEventTicketUrl(eventTicketUrl, schoolGoFanUrl, schoolGoFanId);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        className="gap-2"
        asChild
      >
        <a href={ticketUrl} target="_blank" rel="noopener noreferrer">
          <Ticket className="h-4 w-4" />
          Buy Tickets
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
      {showBadge && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          Powered by GoFan
        </Badge>
      )}
    </div>
  );
}
