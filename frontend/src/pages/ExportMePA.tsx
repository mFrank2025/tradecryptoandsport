import { useState } from 'react';
import { Download, FileSpreadsheet, Check, Package, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { mockProducts } from '../lib/mockData';
import { formatCurrency } from '../lib/utils';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function ExportMePA() {
  const [selected, setSelected] = useState<Set<string>>(new Set(mockProducts.filter((p) => p.attivo).map((p) => p.id)));
  const [exporting, setExporting] = useState(false);

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((s) => s.size === mockProducts.length ? new Set() : new Set(mockProducts.map((p) => p.id)));
  };

  const handleExport = async () => {
    const toExport = mockProducts.filter((p) => selected.has(p.id));
    if (toExport.length === 0) { toast.error('Seleziona almeno un prodotto'); return; }
    setExporting(true);
    await new Promise((r) => setTimeout(r, 500));

    // Build Consip MePA template format
    const headers = [
      'Codice Articolo', 'Descrizione', 'Descrizione Tecnica',
      'Categoria', 'Sotto-categoria', 'Prezzo Unitario', 'Unità di Misura',
      'Aliquota IVA', 'Codice CPV', 'Marca', 'Modello',
      'Disponibilità', 'Tempo Consegna (gg)', 'Stato',
    ];

    const dataRows = toExport.map((p) => [
      p.codiceArticolo,
      p.descrizione,
      p.descrizioneTecnica || '',
      p.categoria,
      p.sottocategoria || '',
      p.prezzoUnitario.toFixed(2).replace('.', ','),
      p.unitaMisura,
      p.iva,
      p.cpv || '',
      p.marca || '',
      p.modello || '',
      p.scorte ?? '',
      p.tempoConsegna ?? '',
      p.attivo ? 'ATTIVO' : 'INATTIVO',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    // Style header row width
    ws['!cols'] = headers.map((_, i) => ({ wch: [15, 40, 60, 15, 15, 12, 12, 8, 14, 15, 15, 10, 10, 8][i] || 15 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogo MePA');

    // Metadata sheet
    const meta = XLSX.utils.aoa_to_sheet([
      ['MepaFlow - Export Catalogo MePA'],
      ['Data export:', new Date().toLocaleDateString('it-IT')],
      ['Prodotti esportati:', toExport.length],
      ['Formato:', 'Template Consip MePA v2024'],
    ]);
    XLSX.utils.book_append_sheet(wb, meta, 'Info');

    XLSX.writeFile(wb, `catalogo_mepa_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${toExport.length} prodotti esportati nel formato MePA`);
    setExporting(false);
  };

  const selectedProducts = mockProducts.filter((p) => selected.has(p.id));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Export MePA</h1>
        <p className="text-muted-foreground text-sm mt-1">Genera il file XLS nel formato ufficiale Consip per il caricamento su MePA</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Seleziona Prodotti</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" onClick={toggleAll}>
                  {selected.size === mockProducts.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockProducts.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.descrizione}</p>
                      <p className="text-xs text-muted-foreground">{p.codiceArticolo} · {p.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{formatCurrency(p.prezzoUnitario)}</p>
                      <p className="text-xs text-muted-foreground">/{p.unitaMisura}</p>
                    </div>
                    {!p.attivo && <Badge variant="secondary" className="text-[10px]">Inattivo</Badge>}
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Riepilogo Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prodotti selezionati</span>
                  <span className="font-medium text-foreground">{selected.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attivi</span>
                  <span className="text-emerald-400">{selectedProducts.filter((p) => p.attivo).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Formato</span>
                  <span className="font-medium text-foreground">XLSX Consip</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Template</span>
                  <span className="text-primary">MePA v2024</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Campi inclusi:</p>
                {['Codice Articolo', 'Descrizione', 'Desc. Tecnica', 'Prezzo + IVA', 'Codice CPV', 'Marca/Modello', 'Disponibilità'].map((f) => (
                  <div key={f} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={handleExport} disabled={exporting || selected.size === 0}>
                {exporting ? (
                  <><Settings2 className="h-4 w-4 animate-spin" />Generazione...</>
                ) : (
                  <><Download className="h-4 w-4" />Scarica XLS MePA</>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Nota Consip</p>
                  <p>Il file generato segue il template ufficiale MePA. Verificare le descrizioni prima del caricamento sul portale Acquisti in Rete PA.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
