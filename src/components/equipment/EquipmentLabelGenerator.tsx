import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, QrCode, Barcode, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EquipmentItem {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category: string;
  code_type?: string | null;
}

interface EquipmentLabelGeneratorProps {
  open: boolean;
  onClose: () => void;
  item: EquipmentItem | null;
  onUpdateCodeType?: (itemId: string, codeType: string) => void;
}

const CODE_TYPES = [
  { value: 'qr', label: 'QR Code', description: 'Best for mobile scanning' },
  { value: 'code128', label: 'Code 128', description: 'Standard barcode' },
  { value: 'code39', label: 'Code 39', description: 'Alphanumeric barcode' },
  { value: 'ean13', label: 'EAN-13', description: '13-digit product code' },
  { value: 'upc', label: 'UPC-A', description: '12-digit retail code' },
];

const LABEL_SIZES = [
  { value: 'small', label: 'Small (1" x 0.5")', width: 150, height: 75 },
  { value: 'medium', label: 'Medium (2" x 1")', width: 200, height: 100 },
  { value: 'large', label: 'Large (3" x 2")', width: 300, height: 200 },
  { value: 'sticker', label: 'Sticker (1.5" x 1.5")', width: 150, height: 150 },
];

export function EquipmentLabelGenerator({ 
  open, 
  onClose, 
  item, 
  onUpdateCodeType 
}: EquipmentLabelGeneratorProps) {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);
  const [codeType, setCodeType] = useState<string>('qr');
  const [labelSize, setLabelSize] = useState<string>('medium');
  const [quantity, setQuantity] = useState('1');
  const [copied, setCopied] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  useEffect(() => {
    if (item) {
      setCodeType(item.code_type || 'qr');
      generateCode();
    }
  }, [item, codeType, labelSize]);

  const getCodeValue = () => {
    if (!item) return '';
    return item.barcode || item.sku || item.id.slice(0, 12).toUpperCase();
  };

  const generateCode = async () => {
    if (!item) return;
    
    const codeValue = getCodeValue();
    setGeneratedCode(codeValue);
    const size = LABEL_SIZES.find(s => s.value === labelSize) || LABEL_SIZES[1];

    if (codeType === 'qr' && canvasRef.current) {
      try {
        await QRCode.toCanvas(canvasRef.current, codeValue, {
          width: Math.min(size.width, size.height) - 20,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
      } catch (err) {
        console.error('QR generation error:', err);
      }
    } else if (barcodeRef.current) {
      try {
        const format = codeType === 'code128' ? 'CODE128' : 
                       codeType === 'code39' ? 'CODE39' : 
                       codeType === 'ean13' ? 'EAN13' : 'UPC';
        
        // For EAN-13 and UPC, ensure proper formatting
        let formattedValue = codeValue;
        if (codeType === 'ean13') {
          formattedValue = codeValue.replace(/\D/g, '').padStart(13, '0').slice(0, 13);
        } else if (codeType === 'upc') {
          formattedValue = codeValue.replace(/\D/g, '').padStart(12, '0').slice(0, 12);
        }

        JsBarcode(barcodeRef.current, formattedValue, {
          format,
          width: 2,
          height: size.height - 40,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
      } catch (err) {
        console.error('Barcode generation error:', err);
        toast({
          title: 'Error generating barcode',
          description: 'The code value may not be compatible with this format',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePrint = () => {
    const qty = parseInt(quantity) || 1;
    const size = LABEL_SIZES.find(s => s.value === labelSize) || LABEL_SIZES[1];
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Please allow popups to print labels', variant: 'destructive' });
      return;
    }

    let codeHtml = '';
    if (codeType === 'qr' && canvasRef.current) {
      codeHtml = `<img src="${canvasRef.current.toDataURL()}" style="max-width: 100%; max-height: 60%;" />`;
    } else if (barcodeRef.current) {
      codeHtml = barcodeRef.current.outerHTML;
    }

    const labelHtml = `
      <div style="
        width: ${size.width}px; 
        height: ${size.height}px; 
        border: 1px solid #ccc; 
        padding: 5px; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        page-break-inside: avoid;
        margin: 5px;
      ">
        ${codeHtml}
        <div style="font-size: 10px; font-weight: bold; margin-top: 5px; text-align: center;">
          ${item?.name || ''}
        </div>
        <div style="font-size: 8px; color: #666;">
          ${generatedCode}
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Equipment Labels - ${item?.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
            }
            .label-grid {
              display: flex;
              flex-wrap: wrap;
            }
            @media print {
              body { margin: 0; padding: 5mm; }
            }
          </style>
        </head>
        <body>
          <div class="label-grid">
            ${Array(qty).fill(labelHtml).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    let dataUrl = '';
    
    if (codeType === 'qr' && canvasRef.current) {
      dataUrl = canvasRef.current.toDataURL('image/png');
    } else if (barcodeRef.current) {
      const svgData = new XMLSerializer().serializeToString(barcodeRef.current);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      dataUrl = URL.createObjectURL(svgBlob);
    }

    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `${item?.name || 'equipment'}-label.${codeType === 'qr' ? 'png' : 'svg'}`;
      link.href = dataUrl;
      link.click();
      
      if (codeType !== 'qr') {
        URL.revokeObjectURL(dataUrl);
      }
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Code copied to clipboard' });
  };

  const handleCodeTypeChange = (value: string) => {
    setCodeType(value);
    if (item && onUpdateCodeType) {
      onUpdateCodeType(item.id, value);
    }
  };

  if (!item) return null;

  const currentSize = LABEL_SIZES.find(s => s.value === labelSize) || LABEL_SIZES[1];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generate Label: {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Code Type</Label>
              <Select value={codeType} onValueChange={handleCodeTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CODE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label Size</Label>
              <Select value={labelSize} onValueChange={setLabelSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity to Print</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Code Value</Label>
              <div className="flex gap-2">
                <Input value={generatedCode} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Using: {item.barcode ? 'Barcode' : item.sku ? 'SKU' : 'Item ID'}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <Card>
              <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px]">
                <div 
                  className="border border-dashed border-muted-foreground/50 rounded p-2 flex flex-col items-center justify-center bg-background"
                  style={{ width: currentSize.width, height: currentSize.height }}
                >
                  {codeType === 'qr' ? (
                    <canvas ref={canvasRef} />
                  ) : (
                    <svg ref={barcodeRef} />
                  )}
                  <div className="text-xs font-bold mt-1 text-center truncate w-full">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {generatedCode}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{item.category}</Badge>
              {item.sku && <Badge variant="secondary">SKU: {item.sku}</Badge>}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print ({quantity})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
