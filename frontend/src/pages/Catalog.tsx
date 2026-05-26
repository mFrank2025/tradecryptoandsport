import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Filter, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { mockProducts } from '../lib/mockData';
import { formatCurrency } from '../lib/utils';
import type { Product } from '../types';
import toast from 'react-hot-toast';

const CATEGORIE = ['Hardware', 'Software', 'Servizi', 'Networking', 'Sicurezza', 'Altro'];
const UNITA = ['pz', 'licenza/anno', 'nodo/anno', 'anno', 'mese', 'ora', 'giornata'];

const emptyProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
  codiceArticolo: '', descrizione: '', descrizioneTecnica: '', categoria: 'Hardware',
  sottocategoria: '', prezzoUnitario: 0, unitaMisura: 'pz', iva: 22,
  cpv: '', marca: '', modello: '', attivo: true, scorte: 0, tempoConsegna: 7,
};

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('tutti');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<typeof emptyProduct>(emptyProduct);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchSearch = p.descrizione.toLowerCase().includes(search.toLowerCase()) ||
      p.codiceArticolo.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'tutti' || p.categoria === filterCat;
    return matchSearch && matchCat;
  });

  const openNew = () => {
    setEditProduct(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    const { id, createdAt, updatedAt, ...rest } = p;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.codiceArticolo || !form.descrizione) {
      toast.error('Codice e descrizione sono obbligatori');
      return;
    }
    if (editProduct) {
      setProducts((ps) => ps.map((p) => p.id === editProduct.id ? { ...editProduct, ...form, updatedAt: new Date().toISOString() } : p));
      toast.success('Prodotto aggiornato');
    } else {
      const newP: Product = { ...form, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setProducts((ps) => [newP, ...ps]);
      toast.success('Prodotto creato');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setProducts((ps) => ps.filter((p) => p.id !== id));
    setDeleteId(null);
    toast.success('Prodotto eliminato');
  };

  const toggleAttivo = (id: string) => {
    setProducts((ps) => ps.map((p) => p.id === id ? { ...p, attivo: !p.attivo } : p));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Catalogo Prodotti</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} prodotti totali · {products.filter((p) => p.attivo).length} attivi</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nuovo Prodotto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cerca per descrizione o codice..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-40">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tutti">Tutte le categorie</SelectItem>
            {CATEGORIE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">Nessun prodotto trovato</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Codice', 'Descrizione', 'Categoria', 'Prezzo', 'IVA', 'Scorte', 'Stato', 'Azioni'].map((h, i) => (
                      <th key={h} className={`text-xs text-muted-foreground font-medium px-4 py-3 ${i >= 3 && i <= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{p.codiceArticolo}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-foreground line-clamp-1">{p.descrizione}</p>
                        {p.marca && <p className="text-xs text-muted-foreground">{p.marca}{p.modello ? ` · ${p.modello}` : ''}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-[10px]">{p.categoria}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap">{formatCurrency(p.prezzoUnitario)}</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{p.iva}%</td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">{p.scorte ?? '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleAttivo(p.id)} className="flex items-center gap-1.5 text-xs">
                          {p.attivo
                            ? <><CheckCircle className="h-3.5 w-3.5 text-emerald-400" /><span className="text-emerald-400">Attivo</span></>
                            : <><XCircle className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Inattivo</span></>
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Codice Articolo *</Label>
              <Input value={form.codiceArticolo} onChange={(e) => setForm((f) => ({ ...f, codiceArticolo: e.target.value }))} placeholder="IT-HW-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIE.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descrizione *</Label>
              <Input value={form.descrizione} onChange={(e) => setForm((f) => ({ ...f, descrizione: e.target.value }))} placeholder="Nome prodotto completo" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Descrizione Tecnica</Label>
              <Textarea rows={3} value={form.descrizioneTecnica} onChange={(e) => setForm((f) => ({ ...f, descrizioneTecnica: e.target.value }))} placeholder="Specifiche tecniche dettagliate..." />
            </div>
            <div className="space-y-1.5">
              <Label>Prezzo Unitario (€)</Label>
              <Input type="number" min={0} step={0.01} value={form.prezzoUnitario} onChange={(e) => setForm((f) => ({ ...f, prezzoUnitario: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unità di Misura</Label>
              <Select value={form.unitaMisura} onValueChange={(v) => setForm((f) => ({ ...f, unitaMisura: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITA.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>IVA (%)</Label>
              <Select value={form.iva.toString()} onValueChange={(v) => setForm((f) => ({ ...f, iva: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="22">22%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Codice CPV</Label>
              <Input value={form.cpv} onChange={(e) => setForm((f) => ({ ...f, cpv: e.target.value }))} placeholder="48000000-8" />
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Modello</Label>
              <Input value={form.modello} onChange={(e) => setForm((f) => ({ ...f, modello: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Scorte</Label>
              <Input type="number" min={0} value={form.scorte ?? 0} onChange={(e) => setForm((f) => ({ ...f, scorte: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Tempo Consegna (gg)</Label>
              <Input type="number" min={0} value={form.tempoConsegna ?? 0} onChange={(e) => setForm((f) => ({ ...f, tempoConsegna: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave}>{editProduct ? 'Salva Modifiche' : 'Crea Prodotto'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Elimina Prodotto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Sei sicuro di voler eliminare questo prodotto? L'operazione non è reversibile.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annulla</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>Elimina</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
