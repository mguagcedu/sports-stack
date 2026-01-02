import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, Users, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  goal_amount: number;
  current_amount: number;
  start_date?: string;
  end_date?: string;
  status: string;
  campaign_type: string;
  image_url?: string;
  team?: { name: string } | null;
}

interface CampaignCardProps {
  campaign: Campaign;
  onDonate?: () => void;
  onView?: () => void;
  showActions?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
};

const typeLabels: Record<string, string> = {
  general: 'General',
  team: 'Team',
  equipment: 'Equipment',
  travel: 'Travel',
  facility: 'Facility',
};

export function CampaignCard({ campaign, onDonate, onView, showActions = true }: CampaignCardProps) {
  const progress = campaign.goal_amount > 0 
    ? Math.min(100, (campaign.current_amount / campaign.goal_amount) * 100) 
    : 0;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {campaign.image_url && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img 
            src={campaign.image_url} 
            alt={campaign.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1">{campaign.name}</h3>
            {campaign.team && (
              <p className="text-sm text-muted-foreground">{campaign.team.name}</p>
            )}
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">
              {typeLabels[campaign.campaign_type] || campaign.campaign_type}
            </Badge>
            <Badge className={statusColors[campaign.status]}>
              {campaign.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {campaign.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {campaign.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-primary">
              {formatCurrency(campaign.current_amount)}
            </span>
            <span className="text-muted-foreground">
              of {formatCurrency(campaign.goal_amount)}
            </span>
          </div>
        </div>
        
        {(campaign.start_date || campaign.end_date) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {campaign.start_date && format(new Date(campaign.start_date), 'MMM d')}
            {campaign.start_date && campaign.end_date && ' - '}
            {campaign.end_date && format(new Date(campaign.end_date), 'MMM d, yyyy')}
          </div>
        )}
      </CardContent>
      
      {showActions && (
        <CardFooter className="gap-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={onView} className="flex-1">
              View Details
            </Button>
          )}
          {onDonate && campaign.status === 'active' && (
            <Button size="sm" onClick={onDonate} className="flex-1">
              <Target className="h-4 w-4 mr-1" />
              Contribute
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
