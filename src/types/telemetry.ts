export type SystemStatus = 'OPTIMAL' | 'DEGRADED' | 'OVERLOADED' | 'OFFLINE' | 'STANDBY';

export type StudyMode = 'EXPLORE' | 'FOCUS' | 'SPACED_REPETITION' | 'ANALYTICS';

export interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

export interface TopicNode {
  id: string;
  name: string;
  category: 'CS' | 'AI & ML' | 'MATH' | 'PHYSICS' | 'SYSTEMS' | 'CYBERSECURITY' | 'ARCH';
  mastery: number; // 0 - 100%
  status: 'DUE' | 'LEARNING' | 'MASTERED' | 'NEW';
  lastReviewed: string;
  coordinates: [number, number, number];
  prerequisites: string[]; // Node IDs required BEFORE learning this topic (A -> X)
  unlocks: string[]; // Node IDs unlocked AFTER learning this topic (X -> B)
  summary: string;
}

export interface StudyTodo {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string;
  topicId?: string;
}

export interface PomodoroState {
  mode: 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
  timeLeft: number; // Seconds
  isRunning: boolean;
  completedSessions: number;
}

export interface AudioFrequencyData {
  isPlaying: boolean;
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  bpm: number;
  rawFftData: Uint8Array;
}

export interface SystemDiagnostics {
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  systemUptime: number;
  gridFrequency: number;
  fps: number;
  masteryScore: number;
  streakDays: number;
}

export interface TelemetryState {
  // Global Study State
  systemStatus: SystemStatus;
  activeMode: StudyMode;
  isOverloaded: boolean;
  gridPowerLevel: number;
  particleDensity: number;
  
  // Interactive Viewport & Camera Zoom State
  mousePosition: MousePosition;
  cameraFocus: boolean;
  hudVisible: boolean;
  bloomIntensity: number;
  zoomLevel: number; // Camera zoom multiplier (0.3 to 3.5)

  // Navigation & Filtering
  searchQuery: string;
  selectedCategory: string | null;
  hoveredCategory: string | null;

  // Knowledge Graph & Study Data
  topicNodes: TopicNode[];
  selectedTopicId: string | null;
  hoveredTopicId: string | null;
  isInspectorOpen: boolean;
  todos: StudyTodo[];
  pomodoro: PomodoroState;

  // Diagnostics & System Metrics
  diagnostics: SystemDiagnostics;

  // Audio Focus Sound Engine
  audioData: AudioFrequencyData;
}

export interface TelemetryActions {
  // Mode & System Setters
  setActiveMode: (mode: StudyMode) => void;
  setSystemStatus: (status: SystemStatus) => void;
  setParticleDensity: (density: number) => void;
  setIsOverloaded: (overloaded: boolean) => void;

  // Viewport & Zoom Setters
  setMousePosition: (pos: MousePosition) => void;
  toggleCameraFocus: () => void;
  setCameraFocus: (focused: boolean) => void;
  toggleHudVisibility: () => void;
  setHudVisibility: (visible: boolean) => void;
  setBloomIntensity: (intensity: number) => void;
  setZoomLevel: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  // Search & Navigation Setters
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setHoveredCategory: (category: string | null) => void;
  setHoveredTopicId: (id: string | null) => void;

  // Knowledge Graph Actions
  setSelectedTopicId: (id: string | null) => void;
  setIsInspectorOpen: (open: boolean) => void;
  addTopicNode: (node: Omit<TopicNode, 'id'>) => void;
  updateTopicMastery: (id: string, mastery: number) => void;

  // To-Do List Actions
  toggleTodo: (id: string) => void;
  addTodo: (todo: Omit<StudyTodo, 'id'>) => void;
  deleteTodo: (id: string) => void;

  // Pomodoro Timer Actions
  togglePomodoro: () => void;
  resetPomodoro: (mode?: PomodoroState['mode']) => void;
  tickPomodoro: () => void;

  // System Diagnostics Setters
  updateDiagnostics: (metrics: Partial<SystemDiagnostics>) => void;

  // Audio Actions
  setAudioData: (data: Partial<AudioFrequencyData>) => void;

  // Reset Action
  resetState: () => void;
}

export type TelemetryStore = TelemetryState & TelemetryActions;
