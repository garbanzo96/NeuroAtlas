import { useEffect, useState } from 'react';
import { assetUrl, loadNeurons, type NeuronRecord } from '../data';

/** Créditos y licencias: obligatorios por CC BY 4.0 (Allen HRA) y CC BY-SA (BodyParts3D, textos). */
export function Credits({ onClose }: { onClose(): void }) {
  const [neurons, setNeurons] = useState<NeuronRecord[]>([]);
  useEffect(() => {
    void loadNeurons().then(setNeurons);
  }, []);
  return (
    <div
      className="na-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Créditos y fuentes"
      onClick={onClose}
    >
      <article className="na-modal__card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="na-sheet__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <p className="na-kicker">Créditos y fuentes</p>
        <h2 className="na-sheet__title">NeuroAtlas</h2>
        <p className="na-lead">
          Atlas docente multiescala, del cuerpo a la molécula. Material educativo en desarrollo: los
          textos son borradores sin revisión experta y no sustituyen a los manuales ni a la
          formación clínica.
        </p>
        <h3>Modelos anatómicos</h3>
        <ul>
          <li>
            Encéfalo y médula: Allen Human Reference Atlas 3D (Allen Institute for Brain Science),
            objetos «brain-male» v1.4 y «spinal-cord-male» v1.1 del 3D Reference Object Library del
            Human Reference Atlas (HuBMAP),{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. Modificados
            (ajuste afín, reetiquetado) por ontoterrorist/neuroanatomia.
          </li>
          <li>
            Cráneo, columna, esqueleto, piel, arterias, ojo y vísceras: BodyParts3D, © The Database
            Center for Life Science,{' '}
            <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/">CC BY-SA 2.1 JP</a>.
            Mitsuhashi N. et al., Nucleic Acids Res. 2009.
          </li>
          <li>
            Nervios periféricos y autónomos: trayectos esquemáticos didácticos, no una segmentación.
          </li>
        </ul>
        <h3>Morfologías neuronales</h3>
        <p>
          NeuroMorpho.Org (RRID:SCR_002145), CC BY 4.0. Tecuatl, Ljungquist y Ascoli (2024), FASEB
          BioAdv 6(7):207–221,{' '}
          <a href="https://doi.org/10.1096/fba.2024-00048">doi:10.1096/fba.2024-00048</a>.
        </p>
        <ul>
          {neurons.map((n) => (
            <li key={n.id}>
              <a href={n.url}>
                {n.name} · {n.species}
              </a>
              :{' '}
              {n.doi.map((doi) => (
                <a key={doi} href={`https://doi.org/${doi}`}>
                  {' '}
                  DOI {doi}
                </a>
              ))}{' '}
              {n.pmid.map((pmid) => (
                <span key={pmid}>PMID {pmid} </span>
              ))}
            </li>
          ))}
        </ul>
        <h3>Contenido reutilizado</h3>
        <p>
          Mallas preparadas, fichas de 332 estructuras, 22 vías, curso, preguntas y casos clínicos
          provienen de{' '}
          <a href="https://github.com/ontoterrorist/neuroanatomia">ontoterrorist/neuroanatomia</a>{' '}
          (código MIT, textos adaptados de la fuente bajo{' '}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>). Los textos
          derivados en NeuroAtlas se distribuyen bajo CC BY-SA 4.0.
        </p>
        <h3>Modelos computacionales</h3>
        <p>
          Hodgkin y Huxley (1952), Izhikevich (2003), Wilson y Cowan (1972), Tsodyks y Markram
          (1997), Kuramoto, Song, Miller y Abbott (2000), entre otros; cada simulador declara su
          alcance.
        </p>
        <h3>Ilustraciones</h3>
        <p>
          Esquemas generados con IA (OpenAI); no son anatomía. Consulta el{' '}
          <a href={assetUrl('img/manifest.json')}>manifiesto de ilustraciones</a>.
        </p>
        <h3>Software</h3>
        <p>
          three.js, React Three Fiber, drei y postprocessing (MIT). Código de NeuroAtlas en GitHub.
        </p>
      </article>
    </div>
  );
}
