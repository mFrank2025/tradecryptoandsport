export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operatore';
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface Product {
  id: string;
  codiceArticolo: string;
  descrizione: string;
  descrizioneTecnica?: string;
  categoria: string;
  sottocategoria?: string;
  prezzoUnitario: number;
  unitaMisura: string;
  iva: number;
  cpv?: string;
  marca?: string;
  modello?: string;
  attivo: boolean;
  scorte?: number;
  tempoConsegna?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RdO {
  id: string;
  numero: string;
  titolo: string;
  stazioneAppaltante: string;
  importoBase: number;
  scadenza: string;
  stato: 'nuova' | 'in_lavorazione' | 'offerta_inviata' | 'aggiudicata' | 'persa' | 'scaduta';
  priorita: 'alta' | 'media' | 'bassa';
  note?: string;
  prodotti: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KpiData {
  prodottiAttivi: number;
  rdoInScadenza: number;
  valoreOfferte: number;
  rdoVinte: number;
  tassoAggiudicazione: number;
  prodottiTotali: number;
}

export type SortDirection = 'asc' | 'desc';
