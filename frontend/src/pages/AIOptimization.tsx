import { useState } from 'react';
import { Zap, Wand2, Copy, Check, RefreshCw, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { mockProducts } from '../lib/mockData';
import toast from 'react-hot-toast';

const TONE_OPTIONS = [
  { value: 'tecnico', label: 'Tecnico formale', desc: 'Linguaggio preciso per PA' },
  { value: 'commerciale', label: 'Commerciale', desc: 'Enfatizza i vantaggi' },
  { value: 'breve', label: 'Conciso', desc: 'Scheda sintetica essenziale' },
];

const sampleOutputs: Record<string, string> = {
  tecnico: `CARATTERISTICHE TECNICHE:
Il prodotto presenta specifiche tecniche di alto profilo adatte all'impiego in contesti della Pubblica Amministrazione. Conformità alle normative vigenti in materia di acquisizioni MePA (D.Lgs. 36/2023).

SPECIFICHE:
• Processore: Intel Core i5-1335U, 12 core, frequenza base 1.3 GHz (turbo 4.6 GHz)
• Memoria: 16 GB DDR4 3200MHz, espandibile fino a 32 GB
• Storage: SSD NVMe PCIe Gen4 512 GB (velocità lettura: 3.500 MB/s)
• Display: 15.6" Full HD IPS anti-glare, 250 nit, sRGB 45%
• Sistema Operativo: Windows 11 Professional 64-bit (licenza OEM)
• Connettività: WiFi 6 (802.11ax), Bluetooth 5.3, Ethernet Gigabit
• Porte: 2x USB-A 3.0, 1x USB-C Thunderbolt 4, HDMI 2.0, RJ-45

CONFORMITÀ: CE, RoHS, ENERGY STAR 8.0, garanzia NBD on-site 3 anni.`,

  commerciale: `Massimizza la produttività del tuo personale con il Laptop HP ProBook 450 G10, la soluzione professionale progettata per soddisfare le esigenze più elevate della Pubblica Amministrazione moderna.

PERCHÉ SCEGLIERLO:
✓ Prestazioni superiori con CPU Intel Core i5 di 13ª generazione
✓ RAM da 16GB per multitasking fluido e veloce
✓ SSD NVMe per avvio e caricamento delle applicazioni in pochi secondi
✓ Batteria autonoma 8h+ per lavorare ovunque
✓ Garanzia HP Care Pack 3 anni con sostituzione NBD

Ideale per: uffici PA, sportelli al pubblico, operatori sul campo.`,

  breve: `Notebook professionale HP ProBook 450 G10, 15.6" FHD, Intel Core i5-1335U, 16GB RAM, SSD 512GB NVMe, Windows 11 Pro. Garanzia 3 anni NBD on-site. Conforme ENERGY STAR 8.0.`,
};

export default function AIOptimization() {
  const [selectedProductId, setSelectedProductId] = useState('2');
  const [tone, setTone] = useState('tecnico');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedProduct = mockProducts.find((p) => p.id === selectedProductId);

  const handleGenerate = async () => {
    if (!selectedProductId) { toast.error('Seleziona un prodotto'); return; }
    setLoading(true);
    setResult('');
    // Simulate API call with streaming effect
    const output = sampleOutputs[tone] || sampleOutputs.tecnico;
    await new Promise((r) => setTimeout(r, 1200));
    let i = 0;
    const interval = setInterval(() => {
      i += 4;
      setResult(output.slice(0, i));
      if (i >= output.length) { clearInterval(interval); setLoading(false); }
    }, 20);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Testo copiato negli appunti');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ottimizzazione AI</h1>
          <p className="text-muted-foreground text-sm">Genera e ottimizza schede prodotto con Claude AI per il catalogo MePA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurazione</CardTitle>
              <CardDescription>Seleziona prodotto e stile di generazione</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Prodotto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona prodotto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockProducts.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-mono text-xs text-muted-foreground mr-2">{p.codiceArticolo}</span>
                        {p.descrizione.slice(0, 40)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="rounded-md bg-muted p-3 space-y-1.5 text-xs">
                  <p className="font-medium text-foreground">{selectedProduct.descrizione}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{selectedProduct.categoria}</Badge>
                    {selectedProduct.marca && <Badge variant="outline">{selectedProduct.marca}</Badge>}
                  </div>
                  {selectedProduct.descrizioneTecnica && (
                    <p className="text-muted-foreground line-clamp-2">{selectedProduct.descrizioneTecnica}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Stile di Scrittura</Label>
                {TONE_OPTIONS.map((t) => (
                  <label key={t.value} className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${tone === t.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                    <input type="radio" name="tone" value={t.value} checked={tone === t.value} onChange={() => setTone(t.value)} className="mt-0.5 accent-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.label}</p>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-1.5">
                <Label>Istruzioni aggiuntive (opzionale)</Label>
                <Textarea
                  rows={3}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Es: Includi riferimento alla normativa CAM, enfatizza la compatibilità con SPID..."
                />
              </div>

              <Button className="w-full" onClick={handleGenerate} disabled={loading || !selectedProductId}>
                {loading ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" />Generazione in corso...</>
                ) : (
                  <><Wand2 className="h-4 w-4" />Genera con Claude AI</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Come funziona</p>
                  <p>Claude AI analizza le specifiche del prodotto e genera una descrizione tecnica ottimizzata per i requisiti MePA, rispettando le linee guida Consip per la qualità delle schede prodotto.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          <Card className="flex flex-col h-full min-h-96">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Descrizione Generata</CardTitle>
                {result && (
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? <><Check className="h-3.5 w-3.5 text-emerald-400" />Copiato</> : <><Copy className="h-3.5 w-3.5" />Copia</>}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              {!result && !loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-3">
                  <Package className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Configura e clicca "Genera" per ottenere la descrizione ottimizzata</p>
                </div>
              ) : (
                <div className="relative">
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed min-h-48">
                    {result}
                    {loading && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />}
                  </pre>
                </div>
              )}
            </CardContent>
            {result && !loading && (
              <div className="p-4 pt-0 border-t border-border mt-2 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => { toast.success('Descrizione salvata sul prodotto'); }}>
                  Salva sul prodotto
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={handleGenerate}>
                  <RefreshCw className="h-3.5 w-3.5" />Rigenera
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
