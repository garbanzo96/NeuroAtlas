import { type MessagePortLike, serveSimulations } from '@neuroatlas/simulation';

// Punto de entrada del Worker: la integración numérica corre fuera del hilo de la interfaz.
serveSimulations(self as unknown as MessagePortLike);
