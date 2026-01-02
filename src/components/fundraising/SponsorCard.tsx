import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Phone, Building2 } from 'lucide-react';

interface Sponsor {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tier: string;
  annual_commitment?: number;
  is_active: boolean;
}

interface SponsorCardProps {
  sponsor: Sponsor;
  onEdit?: () => void;
  showDetails?: boolean;
}

const tierConfig: Record<string, { label: string; color: string; priority: number }> = {
  title: { label: 'Title Sponsor', color: 'bg-purple-500 text-white', priority: 1 },
  platinum: { label: 'Platinum', color: 'bg-slate-300 text-slate-900', priority: 2 },
  gold: { label: 'Gold', color: 'bg-yellow-500 text-yellow-900', priority: 3 },
  silver: { label: 'Silver', color: 'bg-gray-400 text-gray-900', priority: 4 },
  bronze: { label: 'Bronze', color: 'bg-orange-700 text-white', priority: 5 },
};

export function SponsorCard({ sponsor, onEdit, showDetails = false }: SponsorCardProps) {
  const tier = tierConfig[sponsor.tier] || tierConfig.bronze;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className={`overflow-hidden ${!sponsor.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {sponsor.logo_url ? (
              <img 
                src={sponsor.logo_url} 
                alt={sponsor.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold truncate">{sponsor.name}</h4>
                {sponsor.annual_commitment && sponsor.annual_commitment > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(sponsor.annual_commitment)}/year
                  </p>
                )}
              </div>
              <Badge className={tier.color}>
                {tier.label}
              </Badge>
            </div>
            
            {showDetails && (
              <div className="mt-3 space-y-1">
                {sponsor.contact_name && (
                  <p className="text-sm text-muted-foreground">{sponsor.contact_name}</p>
                )}
                {sponsor.contact_email && (
                  <a 
                    href={`mailto:${sponsor.contact_email}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {sponsor.contact_email}
                  </a>
                )}
                {sponsor.contact_phone && (
                  <a 
                    href={`tel:${sponsor.contact_phone}`}
                    className="flex items-center gap-1 text-sm text-muted-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {sponsor.contact_phone}
                  </a>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              {sponsor.website_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Website
                  </a>
                </Button>
              )}
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SponsorLogo({ sponsor, size = 'md' }: { sponsor: Sponsor; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-auto max-w-[60px]',
    md: 'h-12 w-auto max-w-[100px]',
    lg: 'h-16 w-auto max-w-[140px]',
  };

  if (!sponsor.logo_url) return null;

  return (
    <a 
      href={sponsor.website_url || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block"
      title={sponsor.name}
    >
      <img 
        src={sponsor.logo_url} 
        alt={sponsor.name}
        className={`${sizeClasses[size]} object-contain grayscale hover:grayscale-0 transition-all`}
      />
    </a>
  );
}
