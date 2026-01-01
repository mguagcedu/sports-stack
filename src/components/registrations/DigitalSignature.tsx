import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { PenLine, Type, Check } from 'lucide-react';

interface DigitalSignatureProps {
  signerRole: string;
  onSign: (signatureData: { name: string; type: 'typed' | 'drawn'; data: string }) => void;
  disabled?: boolean;
  existingSignature?: {
    signer_name: string;
    signature_type: string;
    signed_at: string;
  };
}

export function DigitalSignature({ signerRole, onSign, disabled, existingSignature }: DigitalSignatureProps) {
  const [typedName, setTypedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed');

  const handleSign = () => {
    if (signatureType === 'typed' && typedName && agreed) {
      onSign({
        name: typedName,
        type: 'typed',
        data: typedName,
      });
    }
  };

  if (existingSignature) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/20">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Signed by {existingSignature.signer_name}</p>
              <p className="text-sm text-muted-foreground">
                {signerRole} signature on {new Date(existingSignature.signed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PenLine className="h-5 w-5" />
          {signerRole} Signature Required
        </CardTitle>
        <CardDescription>
          Please sign below to confirm your acknowledgment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as 'typed' | 'drawn')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="typed" className="gap-2">
              <Type className="h-4 w-4" />
              Type Name
            </TabsTrigger>
            <TabsTrigger value="drawn" className="gap-2" disabled>
              <PenLine className="h-4 w-4" />
              Draw (Coming Soon)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="typed" className="space-y-4">
            <div className="space-y-2">
              <Label>Full Legal Name</Label>
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Enter your full legal name"
                disabled={disabled}
                className="text-lg"
              />
            </div>

            {typedName && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Signature Preview:</p>
                <p className="text-2xl font-script italic text-primary">{typedName}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
          <Checkbox
            id="agreement"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            disabled={disabled}
          />
          <label htmlFor="agreement" className="text-sm cursor-pointer">
            By signing, I confirm that I have read and understand the above document, and I agree to be legally bound by its terms.
            I understand this constitutes a legal electronic signature.
          </label>
        </div>

        <Button
          onClick={handleSign}
          disabled={disabled || !typedName || !agreed}
          className="w-full"
        >
          <PenLine className="mr-2 h-4 w-4" />
          Sign Document
        </Button>
      </CardContent>
    </Card>
  );
}