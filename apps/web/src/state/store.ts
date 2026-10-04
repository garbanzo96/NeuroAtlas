import type { KnowledgeBase } from '@neuroatlas/knowledge';
import type { SelectionState } from '@neuroatlas/schemas';
import type { CameraCommand } from '@neuroatlas/viewer-3d';
import { create } from 'zustand';
import {
  type ContextNotice,
  applyLessonStep,
  defaultSceneId,
  enterScene,
  selectFromSearch,
} from './logic';
import type { SimulationProtocolState } from './url';

export type MobileTab = 'explore' | 'viewer' | 'info' | 'panel';

export const DEFAULT_PROTOCOL: SimulationProtocolState = {
  amplitude: 10,
  start: 10,
  duration: 80,
  total: 100,
  dt: 0.01,
};

export interface AppState {
  kb: KnowledgeBase | null;
  assetPaths: ReadonlyMap<string, { path: string; sha256: string }>;
  selection: SelectionState | null;
  layerOpacity: Record<string, number>;
  hoveredEntityId: string | null;
  notice: ContextNotice | null;
  warnings: string[];
  lesson: { lessonId: string; stepIndex: number } | null;
  protocol: SimulationProtocolState;
  showLabels: boolean;
  reducedMotion: boolean;
  mobileTab: MobileTab;
  cameraCommand: { command: CameraCommand; nonce: number } | null;
  shortcutsOpen: boolean;

  initialize(args: {
    kb: KnowledgeBase;
    assetPaths: ReadonlyMap<string, { path: string; sha256: string }>;
    selection: SelectionState | null;
    lesson: AppState['lesson'];
    protocol: SimulationProtocolState | null;
    warnings: string[];
    reducedMotion: boolean;
  }): void;
  goToScene(sceneId: string, mode?: 'transition' | 'jump'): void;
  selectEntity(entityId: string | null): void;
  selectFromSearch(entityId: string): void;
  setHovered(entityId: string | null): void;
  toggleLayer(layerId: string): void;
  setLayerOpacity(layerId: string, opacity: number): void;
  dismissNotice(): void;
  dismissWarnings(): void;
  startLesson(lessonId: string): void;
  lessonStep(delta: number): void;
  exitLesson(): void;
  setProtocol(protocol: Partial<SimulationProtocolState>): void;
  setTimeCursor(runId: string, value: number | null): void;
  setShowLabels(value: boolean): void;
  setReducedMotion(value: boolean): void;
  setMobileTab(tab: MobileTab): void;
  sendCameraCommand(command: CameraCommand): void;
  setShortcutsOpen(open: boolean): void;
}

export const useAppStore = create<AppState>((set, get) => ({
  kb: null,
  assetPaths: new Map(),
  selection: null,
  layerOpacity: {},
  hoveredEntityId: null,
  notice: null,
  warnings: [],
  lesson: null,
  protocol: DEFAULT_PROTOCOL,
  showLabels: true,
  reducedMotion: false,
  mobileTab: 'viewer',
  cameraCommand: null,
  shortcutsOpen: false,

  initialize({ kb, assetPaths, selection, lesson, protocol, warnings, reducedMotion }) {
    const sceneId = selection?.sceneId ?? defaultSceneId(kb);
    const entry = enterScene(kb, null, sceneId, 'initial');
    let next: Partial<AppState> = {
      kb,
      assetPaths,
      selection: selection ?? entry.selection,
      layerOpacity: entry.layerOpacity,
      warnings,
      reducedMotion,
      protocol: protocol ?? DEFAULT_PROTOCOL,
    };
    if (lesson) {
      const step = applyLessonStep(kb, lesson.lessonId, lesson.stepIndex, null);
      if (step) {
        next = {
          ...next,
          lesson: { lessonId: lesson.lessonId, stepIndex: step.stepIndex },
          // Si el enlace trae selección explícita para la misma escena, se respeta.
          selection:
            selection && selection.sceneId === step.selection.sceneId ? selection : step.selection,
          layerOpacity: step.layerOpacity,
        };
      }
    }
    set(next);
  },

  goToScene(sceneId, mode = 'jump') {
    const { kb, selection } = get();
    if (!kb || !kb.scene(sceneId)) return;
    const entry = enterScene(kb, selection?.sceneId ?? null, sceneId, mode);
    set({
      selection: entry.selection,
      layerOpacity: entry.layerOpacity,
      notice: entry.notice,
      hoveredEntityId: null,
      mobileTab: 'viewer',
    });
  },

  selectEntity(entityId) {
    const { selection } = get();
    if (!selection) return;
    set({ selection: { ...selection, selectedEntityIds: entityId ? [entityId] : [] } });
  },

  selectFromSearch(entityId) {
    const { kb, selection } = get();
    if (!kb || !selection) return;
    const result = selectFromSearch(kb, selection.sceneId, entityId);
    if (result.selection === null) {
      set({
        selection: { ...selection, selectedEntityIds: result.selectedEntityIds },
        mobileTab: 'info',
      });
    } else {
      set({
        selection: result.selection,
        layerOpacity: result.layerOpacity,
        notice: result.notice,
        mobileTab: 'info',
      });
    }
  },

  setHovered(entityId) {
    if (get().hoveredEntityId !== entityId) set({ hoveredEntityId: entityId });
  },

  toggleLayer(layerId) {
    const { selection } = get();
    if (!selection) return;
    const visible = selection.visibleLayerIds.includes(layerId)
      ? selection.visibleLayerIds.filter((id) => id !== layerId)
      : [...selection.visibleLayerIds, layerId];
    // Ocultar una capa puede dejar sin evento de salida al elemento señalado.
    set({ selection: { ...selection, visibleLayerIds: visible }, hoveredEntityId: null });
  },

  setLayerOpacity(layerId, opacity) {
    set({ layerOpacity: { ...get().layerOpacity, [layerId]: Math.min(1, Math.max(0, opacity)) } });
  },

  dismissNotice() {
    set({ notice: null });
  },

  dismissWarnings() {
    set({ warnings: [] });
  },

  startLesson(lessonId) {
    const { kb, selection } = get();
    if (!kb) return;
    const step = applyLessonStep(kb, lessonId, 0, selection?.sceneId ?? null);
    if (!step) return;
    set({
      lesson: { lessonId, stepIndex: step.stepIndex },
      selection: step.selection,
      layerOpacity: step.layerOpacity,
      notice: step.notice,
      mobileTab: 'panel',
    });
  },

  lessonStep(delta) {
    const { kb, lesson, selection } = get();
    if (!kb || !lesson) return;
    const step = applyLessonStep(
      kb,
      lesson.lessonId,
      lesson.stepIndex + delta,
      selection?.sceneId ?? null,
    );
    if (!step || step.stepIndex === lesson.stepIndex) return;
    set({
      lesson: { lessonId: lesson.lessonId, stepIndex: step.stepIndex },
      selection: step.selection,
      layerOpacity: step.layerOpacity,
      notice: step.notice,
    });
  },

  exitLesson() {
    set({ lesson: null });
  },

  setProtocol(protocol) {
    set({ protocol: { ...get().protocol, ...protocol } });
  },

  setTimeCursor(runId, value) {
    const { selection } = get();
    if (!selection) return;
    if (value === null) {
      const { timeCursor: _drop, ...rest } = selection;
      set({ selection: rest });
    } else {
      set({ selection: { ...selection, timeCursor: { runId, value, units: 'ms' } } });
    }
  },

  setShowLabels(value) {
    set({ showLabels: value });
  },

  setReducedMotion(value) {
    set({ reducedMotion: value });
  },

  setMobileTab(tab) {
    set({ mobileTab: tab });
  },

  sendCameraCommand(command) {
    set({ cameraCommand: { command, nonce: (get().cameraCommand?.nonce ?? 0) + 1 } });
  },

  setShortcutsOpen(open) {
    set({ shortcutsOpen: open });
  },
}));
