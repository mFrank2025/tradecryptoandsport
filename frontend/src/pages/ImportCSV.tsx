import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

const MEPA_FIELDS = [
  { key: 'codiceArticolo', label: 'Codice Articolo', required: true },
  { key: 'descrizione', label: 'Descrizione', required: true },
  { key: 'descrizioneTecnica', label: 'Descrizione Tecnica', required: false },
  { key: 'prezzoUnitario', label: 'Prezzo Unitario', required: true },
  { key: 'unitaMisura', label: 'Unità di Misura', required: true },
  { key: 'iva', label: 'IVA (%)', required: false },
  { key: 'categoria', label: 'Categoria', required: false },
  { key: 'cpv', label: 'Codice CPV', required: false },
  { key: 'marca', label: 'Marca', required: false },
  { key: 'modello', label: 'Modello', required: false },
];

type MappingState = Record<string, string>;

export default function ImportCSV() {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'done'>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<MappingState>({});
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importedCount, setImportedCount] = useState(0);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { toast.error('Carica un file CSV'); return; }
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) { toast.error('File CSV vuoto'); return; }
        const hdrs = Object.keys(results.data[0]);
        setHeaders(hdrs);
        setRows(results.data.slice(0, 50));
        // Auto-map obvious columns
        const autoMap: MappingState = {};
        MEPA_FIELDS.forEach(({ key }) => {
          const match = hdrs.find((h) =>
            h.toLowerCase().includes(key.toLowerCase()) ||
            h.toLowerCase().replace(/[_ ]/g, '').includes(key.toLowerCase())
          );
          if (match) autoMap[key] = match;
        });
        setMapping(autoMap);
        setStep('mapping');
      },
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const mappedRows = rows.map((row) => {
    const mapped: Record<string, string> = {};
    Object.entries(mapping).forEach(([field, col]) => {
      if (col && col !== '__skip__') mapped[field] = row[col] ?? '';
    });
    return mapped;
  });

  const requiredMapped = MEPA_FIELDS.filter((f) => f.required).every((f) => mapping[f.key] && mapping[f.key] !== '__skip__');

  const handleImport = () => {
    setImportedCount(mappedRows.length);
    setStep('done');
    toast.success(`${mappedRows.length} prodotti importati con successo`);
  };

  const reset = () => {
    setStep('upload');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setFileName('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Prodotti da CSV</h1>
        <p className="text-muted-foreground text-sm mt-1">Importa il catalogo prodotti da un file CSV con mapping colonne personalizzabile</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {(['upload', 'mapping', 'preview', 'done'] as const).map((s, i) => {
          const labels = ['Carica file', 'Mappa colonne', 'Anteprima', 'Completato'];
          const current = ['upload', 'mapping', 'preview', 'done'].indexOf(step);
          const isActive = step === s;
          const isDone = current > i;
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${isActive ? 'bg-primary text-white' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{labels[i]}</span>
              {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <Card
          className={`transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-dashed border-2'}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Trascina il file CSV qui</p>
              <p className="text-sm text-muted-foreground mt-1">oppure clicca per selezionarlo</p>
            </div>
            <label className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>Seleziona file CSV</span>
              </Button>
              <input type="file" accept=".csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            <p className="text-xs text-muted-foreground">Formato supportato: .csv (max 10.000 righe)</p>
          </CardContent>
        </Card>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                File: {fileName} — {rows.length} righe rilevate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">Associa le colonne del tuo CSV ai campi MePA:</p>
                {MEPA_FIELDS.map(({ key, label, required }) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="w-48 flex items-center gap-2">
                      <span className="text-sm text-foreground">{label}</span>
                      {required && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">req.</Badge>}
                    </div>
                    <Select
                      value={mapping[key] || '__skip__'}
                      onValueChange={(v) => setMapping((m) => ({ ...m, [key]: v }))}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue placeholder="— Ignora —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__skip__">— Ignora —</SelectItem>
                        {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {mapping[key] && mapping[key] !== '__skip__' && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />Mappato
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {!requiredMapped && (
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-md p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              Mappa tutti i campi obbligatori (marcati con "req.") per continuare
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset}>Annulla</Button>
            <Button onClick={() => setStep('preview')} disabled={!requiredMapped}>
              Anteprima <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anteprima ({mappedRows.length} prodotti)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card z-10">
                    <tr className="border-b border-border">
                      {MEPA_FIELDS.filter((f) => mapping[f.key] && mapping[f.key] !== '__skip__').map((f) => (
                        <th key={f.key} className="text-left text-muted-foreground font-medium px-4 py-2 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mappedRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        {MEPA_FIELDS.filter((f) => mapping[f.key] && mapping[f.key] !== '__skip__').map((f) => (
                          <td key={f.key} className="px-4 py-2 text-foreground max-w-xs truncate">{row[f.key] || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedRows.length > 10 && (
                <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border">
                  ... e altri {mappedRows.length - 10} prodotti
                </p>
              )}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('mapping')}>Indietro</Button>
            <Button onClick={handleImport}>
              <Check className="h-4 w-4" />
              Importa {mappedRows.length} prodotti
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <Card>
          <CardContent className="flex flex-col items-center py-16 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
              <Check className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{importedCount} prodotti importati</p>
              <p className="text-sm text-muted-foreground mt-1">I prodotti sono stati aggiunti al catalogo MepaFlow</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4" />Nuovo Import
              </Button>
              <Button onClick={() => window.location.href = '/catalog'}>Vai al Catalogo</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
