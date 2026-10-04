import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Qué mostrar si un hijo falla; recibe el mensaje de error. */
  fallback: (message: string) => ReactNode;
  /** Cambiar esta clave reinicia el límite (p. ej. al cambiar de escena). */
  resetKey?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
  resetKey?: string;
}

/**
 * Aísla una parte de la interfaz: si falla (p. ej. el visor 3D no puede cargar su código o crear el
 * contexto WebGL), muestra un mensaje y el resto de la app sigue funcionando.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NeuroAtlas: fallo aislado en la interfaz', error, info.componentStack);
  }

  override render() {
    return this.state.error ? this.props.fallback(this.state.error.message) : this.props.children;
  }
}
