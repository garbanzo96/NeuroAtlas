import type { LevelId } from '../levels';

/** Variantes que ofrece cada escena micro (la escena lee `useAtlas().variant`; null = la primera). */
export const MICRO_VARIANTS: Partial<Record<LevelId, { id: string; label: string }[]>> = {
  neurona: [
    { id: 'piramidal', label: 'Neurona piramidal' },
    { id: 'purkinje', label: 'Célula de Purkinje' },
    { id: 'estrellada', label: 'Estrellada espinosa' },
    { id: 'cesta', label: 'Célula en cesta' },
    { id: 'motoneurona', label: 'Motoneurona α' },
    { id: 'bipolar', label: 'Bipolar de retina' },
    { id: 'pseudounipolar', label: 'Ganglio de la raíz dorsal' },
  ],
  molecula: [
    { id: 'bomba', label: 'Bomba Na⁺/K⁺' },
    { id: 'canales', label: 'Canales y potencial de acción' },
    { id: 'reposo', label: 'Gradientes en reposo' },
  ],
};
