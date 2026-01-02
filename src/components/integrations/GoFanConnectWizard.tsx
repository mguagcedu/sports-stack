import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink, CheckCircle2, AlertCircle, Ticket } from 'lucide-react';
import { generateGoFanStateSearchUrl, parseGoFanSchoolId } from '@/lib/integrations';

interface GoFanConnectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stateCode: string;
  onConnect: (schoolId: string, schoolUrl: string) => void;
}

export function GoFanConnectWizard({
  open,
  onOpenChange,
  stateCode,
  onConnect,
}: GoFanConnectWizardProps) {
  const [step, setStep] = useState(1);
  const [pastedUrl, setPastedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUrlPaste = () => {
    setError(null);
    
    if (!pastedUrl.includes('gofan.co')) {
      setError('Please paste a valid GoFan school URL');
      return;
    }
    
    const schoolId = parseGoFanSchoolId(pastedUrl);
    
    if (!schoolId) {
      setError('Could not find school ID in URL. Make sure it\'s a school page URL like: gofan.co/app/school/XXXXX');
      return;
    }
    
    onConnect(schoolId, pastedUrl);
    onOpenChange(false);
    setStep(1);
    setPastedUrl('');
  };

  const searchUrl = generateGoFanStateSearchUrl(stateCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Connect GoFan
          </DialogTitle>
          <DialogDescription>
            Not Linked – Powered by GoFan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  1
                </span>
                Find your school on GoFan
              </div>
              
              <p className="text-sm">
                Click below to open GoFan's school directory for {stateCode}. Find your school and copy the URL.
              </p>
              
              <Button
                variant="outline"
                className="w-full justify-between"
                asChild
              >
                <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                  Open GoFan Schools ({stateCode})
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>

              <Button onClick={() => setStep(2)} className="w-full">
                I found my school, continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  2
                </span>
                Paste your school's GoFan URL
              </div>
              
              <div className="space-y-2">
                <Label>GoFan School Page URL</Label>
                <Input
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="https://gofan.co/app/school/XXXXX"
                />
                <p className="text-xs text-muted-foreground">
                  Example: <code className="bg-muted px-1 py-0.5 rounded">https://gofan.co/app/school/AK14022</code>
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleUrlPaste} className="flex-1" disabled={!pastedUrl}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Connect
                </Button>
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Sports Stack is not affiliated with or endorsed by GoFan. This creates a link to your existing GoFan page.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
