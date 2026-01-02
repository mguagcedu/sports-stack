import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { INTEGRATION_DISCLAIMER } from '@/lib/integrations';

interface IntegrationDisclaimerProps {
  compact?: boolean;
}

export function IntegrationDisclaimer({ compact = false }: IntegrationDisclaimerProps) {
  if (compact) {
    return (
      <p className="text-xs text-muted-foreground text-center">
        Sports Stack is not affiliated with GoFan or FinalForms.
      </p>
    );
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="text-xs">
        {INTEGRATION_DISCLAIMER}
      </AlertDescription>
    </Alert>
  );
}
