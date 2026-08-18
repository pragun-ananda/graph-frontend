import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Square,
  BookOpen,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Flame,
  Award,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles,
  Target,
  Search,
  Compass,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Zap,
  X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import * as THREE from 'three';

const DOMAIN_HUES: Record<string, number> = {
  'AI & ML': 0.52,       // ~187° Electric Cyan
  'CS': 0.91,            // ~328° Hot Pink / Magenta
  'SYSTEMS': 0.75,       // ~270° Cosmic Purple / Violet
  'MATH': 0.14,          // ~50° Solar Electric Yellow / Gold
  'PHYSICS': 0.43,       // ~155° Matrix Emerald Green
  'CYBERSECURITY': 0.96, // ~345° Vivid Coral Crimson
  'ARCH': 0.60           // ~216° Deep Electric Blue
};

const getCategoryShade = (id: string, category: string): string => {
  const baseHue = DOMAIN_HUES[category] ?? 0.52;

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const sat = 0.78 + ((positiveHash % 100) / 100) * 0.22;
  const light = 0.45 + (((positiveHash >> 3) % 100) / 100) * 0.23;

  const color = new THREE.Color();
  color.setHSL(baseHue, sat, light);
  return '#' + color.getHexString();
};

export default function TelemetryHUD() {
  const store = useStore();

  const [activeTab, setActiveTab] = useState<'TOPICS' | 'TODOS'>('TOPICS');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('AI & ML');
  const [newTodoPriority, setNewTodoPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (store.pomodoro.isRunning) {
      interval = setInterval(() => {
        store.tickPomodoro();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [store.pomodoro.isRunning, store]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    store.addTodo({
      title: newTodoTitle.trim(),
      category: newTodoCategory,
      priority: newTodoPriority,
      completed: false,
      dueDate: 'Today'
    });
    setNewTodoTitle('');
  };

  if (!store.hudVisible) {
    return (
      <div className="pointer-events-none fixed inset-0 z-20 flex items-bottom justify-end p-6">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => store.setHudVisibility(true)}
          className="pointer-events-auto px-4 py-2 bg-[#080c16]/90 backdrop-blur-md border border-[#00f0ff]/40 text-[#00f0ff] text-xs tracking-widest font-mono rounded hover:bg-[#00f0ff]/10 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <Eye size={14} /> RESTORE HUD [H]
        </motion.button>
      </div>
    );
  }

  const categories = ['ALL', 'AI & ML', 'CS', 'SYSTEMS', 'MATH', 'PHYSICS', 'CYBERSECURITY', 'ARCH'];
  const completedTodosCount = store.todos.filter((t) => t.completed).length;
  const selectedNode = store.topicNodes.find((n) => n.id === store.selectedTopicId);
  const selectedNodeColor = selectedNode ? getCategoryShade(selectedNode.id, selectedNode.category) : '#00f0ff';

  const filteredTopics = store.topicNodes.filter((t) => {
    const categoryMatch = !store.selectedCategory || store.selectedCategory === 'ALL' || t.category === store.selectedCategory;
    const searchMatch = !store.searchQuery || t.name.toLowerCase().includes(store.searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* ================= UNIFIED TOP BAR (BRANDING, CLUSTERS & SEARCH) ================= */}
      <header className="pointer-events-auto glass-panel px-4 py-2.5 rounded-lg flex items-center justify-between gap-4 relative">
        <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t-2 border-l-2 border-[#00f0ff]" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b-2 border-r-2 border-[#00f0ff]" />

        {/* 1. Branding & Title */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Sparkles size={18} className="text-[#00f0ff] animate-pulse" />
          <h1 className="font-display font-extrabold text-sm md:text-base tracking-wider text-slate-100 uppercase">
            COSMOS
          </h1>
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block flex-shrink-0" />

        {/* 2. Domain Cluster Navigation Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 font-mono text-xs max-w-full no-scrollbar">
          <span className="text-slate-500 font-bold items-center gap-1 mr-1 hidden lg:flex flex-shrink-0">
            <Compass size={13} className="text-[#00f0ff]" /> CLUSTERS:
          </span>
          {categories.map((cat) => {
            const isSelected = (cat === 'ALL' && !store.selectedCategory) || store.selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => store.setSelectedCategory(cat === 'ALL' ? null : cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all border whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                    : 'bg-slate-950/60 text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-px bg-white/10 hidden sm:block flex-shrink-0" />

        {/* 3. Collapsible Quick Search Bar */}
        <div className="flex items-center bg-slate-950/80 border border-white/10 rounded-lg p-1 font-mono text-xs flex-shrink-0">
          <AnimatePresence initial={false} mode="wait">
            {isSearchOpen ? (
              <motion.div
                key="search-expanded"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'auto', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 px-1.5 py-0.5 overflow-hidden"
              >
                <Search size={14} className="text-[#00f0ff] flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search 220+ concepts..."
                  value={store.searchQuery}
                  onChange={(e) => store.setSearchQuery(e.target.value)}
                  className="bg-transparent font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none w-36 md:w-48"
                />
                <button
                  type="button"
                  onClick={() => {
                    store.setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="text-slate-400 hover:text-slate-100 p-0.5 flex-shrink-0"
                  title="Close search"
                >
                  <X size={13} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="search-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => setIsSearchOpen(true)}
                className="p-1 text-slate-400 hover:text-[#00f0ff] transition-colors rounded flex items-center gap-1.5"
                title="Open concept search"
              >
                <Search size={15} />
                {store.searchQuery && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ================= MIDDLE REGION (SIDEBAR & INSPECTOR) ================= */}
      <main className="flex-1 flex justify-between items-start my-2 pointer-events-none overflow-hidden relative">
        {/* Left Study Sidebar */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onWheel={(e) => e.stopPropagation()}
          className={`pointer-events-auto glass-panel rounded-xl p-4 transition-all duration-300 relative flex flex-col max-h-[calc(100vh-180px)] ${
            leftPanelCollapsed ? 'w-12' : 'w-80 md:w-96'
          }`}
        >
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="absolute -right-3 top-4 bg-[#080c16] border border-white/20 text-slate-300 p-1 rounded-full hover:text-[#00f0ff] transition-colors z-30"
          >
            {leftPanelCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {!leftPanelCollapsed ? (
            <div className="flex flex-col h-full space-y-4 font-mono overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('TOPICS')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'TOPICS'
                        ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <BookOpen size={13} /> GRAPH NODES ({filteredTopics.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('TODOS')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'TODOS'
                        ? 'bg-[#00f0ff] text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckSquare size={13} /> TASKS ({completedTodosCount}/{store.todos.length})
                  </button>
                </div>
              </div>

              {/* TAB 1: 200+ TOPICS GRAPH LIST */}
              {activeTab === 'TOPICS' && (
                <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>Click any node title to focus camera:</span>
                    <span className="text-[#00f0ff] font-bold">{filteredTopics.length} Nodes</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 pb-6 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                    {filteredTopics.map((topic) => (
                      <div
                        key={topic.id}
                        onClick={() => store.setSelectedTopicId(topic.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          store.selectedTopicId === topic.id
                            ? 'border-[#00f0ff] bg-[#00f0ff]/15 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                            : 'border-white/10 bg-slate-950/70 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-slate-200">{topic.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            topic.status === 'MASTERED'
                              ? 'bg-[#00ff9d]/20 text-[#00ff9d]'
                              : topic.status === 'LEARNING'
                              ? 'bg-[#00f0ff]/20 text-[#00f0ff]'
                              : topic.status === 'DUE'
                              ? 'bg-[#ffaa00]/20 text-[#ffaa00]'
                              : 'bg-[#ff3366]/20 text-[#ff3366]'
                          }`}>
                            {topic.status}
                          </span>
                        </div>

                        <div className="mt-1.5">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>{topic.category}</span>
                            <span className="text-[#00f0ff] font-bold">{topic.mastery}% Mastery</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-[#00f0ff] h-full transition-all duration-300"
                              style={{ width: `${topic.mastery}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="h-10 w-full flex-shrink-0 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* TAB 2: TODAY'S TO-DO LIST */}
              {activeTab === 'TODOS' && (
                <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                  <form onSubmit={handleAddTodo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new study goal..."
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      className="flex-1 bg-slate-950/80 border border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#00f0ff]"
                    />
                    <button
                      type="submit"
                      className="bg-[#00f0ff] text-slate-950 p-1.5 rounded hover:bg-[#00f0ff]/80 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1.5 pb-6 overscroll-contain" onWheel={(e) => e.stopPropagation()}>
                    {store.todos.map((todo) => (
                      <div
                        key={todo.id}
                        className={`p-2.5 rounded-lg border text-xs transition-all flex items-start justify-between gap-2 ${
                          todo.completed
                            ? 'bg-slate-950/30 border-white/5 opacity-60'
                            : 'bg-slate-950/70 border-white/10 hover:border-[#00f0ff]/40'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <button
                            onClick={() => store.toggleTodo(todo.id)}
                            className="mt-0.5 text-slate-400 hover:text-[#00f0ff] transition-colors"
                          >
                            {todo.completed ? (
                              <CheckSquare size={15} className="text-[#00ff9d]" />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                          <div>
                            <p className={`font-semibold text-slate-200 ${todo.completed ? 'line-through' : ''}`}>
                              {todo.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px]">
                              <span className="text-[#00f0ff]">{todo.category}</span>
                              <span className={`px-1 rounded font-bold ${
                                todo.priority === 'HIGH'
                                  ? 'bg-[#ff3366]/20 text-[#ff3366]'
                                  : todo.priority === 'MEDIUM'
                                  ? 'bg-[#ffaa00]/20 text-[#ffaa00]'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {todo.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => store.deleteTodo(todo.id)}
                          className="text-slate-500 hover:text-[#ff3366] transition-colors p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    <div className="h-10 w-full flex-shrink-0 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-4 text-slate-400">
              <BookOpen size={18} />
              <CheckSquare size={18} />
            </div>
          )}
        </motion.div>

        {/* Floating "SEE TOPIC" Action Button on the Bottom Right of the Screen */}
        <AnimatePresence>
          {selectedNode && !store.isInspectorOpen && (
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.9 }}
              className="pointer-events-auto fixed bottom-6 right-6 z-30"
            >
              <button
                onClick={() => store.setIsInspectorOpen(true)}
                style={{
                  borderColor: selectedNodeColor,
                  boxShadow: `0 0 24px ${selectedNodeColor}50`,
                  backgroundColor: 'rgba(8, 12, 22, 0.92)'
                }}
                className="px-5 py-3 rounded-xl border text-slate-100 font-mono text-xs font-bold tracking-wider hover:scale-105 transition-all flex items-center gap-3 backdrop-blur-md shadow-2xl cursor-pointer"
              >
                <BookOpen size={16} style={{ color: selectedNodeColor }} />
                <span>SEE TOPIC:</span>
                <span className="uppercase font-extrabold" style={{ color: selectedNodeColor }}>
                  {selectedNode.name}
                </span>
                <span className="text-sm font-bold" style={{ color: selectedNodeColor }}>→</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Selected Knowledge Concept Inspector Card (Opens on SEE TOPIC click) */}
        <AnimatePresence>
          {selectedNode && store.isInspectorOpen && (
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              onWheel={(e) => e.stopPropagation()}
              className="pointer-events-auto glass-panel p-4 md:p-5 rounded-xl w-80 md:w-96 font-mono text-xs space-y-3.5 mr-6 max-h-[calc(100vh-140px)] flex flex-col shadow-2xl overscroll-contain"
            >
              {/* Fixed Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-[#00f0ff]" />
                  <span className="font-bold text-slate-100 uppercase tracking-wider truncate max-w-[220px]">{selectedNode.name}</span>
                </div>
                <button
                  onClick={() => store.setIsInspectorOpen(false)}
                  className="text-slate-400 hover:text-slate-100 p-1 font-bold"
                  title="Close Inspector"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Inspector Body */}
              <div
                className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 pb-4 overscroll-contain"
                onWheel={(e) => e.stopPropagation()}
              >
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedNode.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-950/60 p-2.5 rounded border border-white/5">
                    <span className="text-slate-400 block mb-0.5">CATEGORY</span>
                    <span className="text-[#00f0ff] font-bold">{selectedNode.category}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded border border-white/5">
                    <span className="text-slate-400 block mb-0.5">MASTERY</span>
                    <span className="text-[#00ff9d] font-bold">{selectedNode.mastery}%</span>
                  </div>
                </div>

                {/* 1. PREREQUISITES SECTION */}
                <div className="pt-2.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-[#ffaa00]">
                      <ShieldAlert size={13} />
                      <span>PREREQUISITES</span>
                    </div>
                    <span className="text-[10px] text-[#ffaa00] font-bold">
                      {selectedNode.prerequisites.length} REQ
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedNode.prerequisites.length > 0 ? (
                      selectedNode.prerequisites.map((prereqId) => {
                        const prereqNode = store.topicNodes.find((n) => n.id === prereqId);
                        if (!prereqNode) return null;

                        return (
                          <div
                            key={prereqId}
                            onClick={() => store.setSelectedTopicId(prereqNode.id)}
                            className="p-2 rounded bg-slate-950/80 border border-[#ffaa00]/30 hover:border-[#ffaa00] text-slate-200 text-[11px] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <ArrowLeft size={12} className="text-[#ffaa00] flex-shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                              <span className="truncate font-semibold text-slate-200 group-hover:text-[#ffaa00]">
                                {prereqNode.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#ffaa00] font-bold ml-2">
                              {prereqNode.mastery}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[10px] text-slate-500 italic p-1">
                        No prerequisites required for this foundational topic.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. LEARN NEXT SECTION */}
                <div className="pt-2.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 text-[#00ff9d]">
                      <Zap size={13} />
                      <span>LEARN NEXT</span>
                    </div>
                    <span className="text-[10px] text-[#00ff9d] font-bold">
                      {selectedNode.unlocks.length} UNLOCKED
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedNode.unlocks.length > 0 ? (
                      selectedNode.unlocks.map((unlockId) => {
                        const unlockNode = store.topicNodes.find((n) => n.id === unlockId);
                        if (!unlockNode) return null;

                        return (
                          <div
                            key={unlockId}
                            onClick={() => store.setSelectedTopicId(unlockNode.id)}
                            className="p-2 rounded bg-slate-950/80 border border-[#00ff9d]/30 hover:border-[#00ff9d] text-slate-200 text-[11px] cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <ArrowRight size={12} className="text-[#00ff9d] flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              <span className="truncate font-semibold text-slate-200 group-hover:text-[#00ff9d]">
                                {unlockNode.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#00ff9d] font-bold ml-2">
                              {unlockNode.mastery}%
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[10px] text-slate-500 italic p-1">
                        Advanced topic (end of current domain path).
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-10 w-full flex-shrink-0 pointer-events-none" />
              </div>

              {/* Action Button at bottom */}
              <div className="pt-2 flex-shrink-0">
                <button
                  onClick={() => store.updateTopicMastery(selectedNode.id, selectedNode.mastery + 10)}
                  className="w-full bg-[#00f0ff] text-slate-950 py-2 rounded font-bold text-center hover:bg-[#00f0ff]/80 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                >
                  +10% MASTERY RECALL
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ================= BOTTOM LEFT STUDY STATS & FOCUS TIMER ================= */}
      <footer className="pointer-events-auto flex items-center justify-start gap-3 mt-2">
        {/* Focus Timer Box */}
        <div className="glass-panel px-3.5 py-2 rounded-lg flex items-center gap-3 font-mono text-xs shadow-lg">
          <Clock size={15} className="text-[#00f0ff]" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400 uppercase">{store.pomodoro.mode}:</span>
            <span className="text-[#00f0ff] font-bold text-sm tracking-wider">
              {formatTimer(store.pomodoro.timeLeft)}
            </span>
          </div>
          <button
            onClick={() => store.togglePomodoro()}
            className="p-1 rounded hover:bg-white/10 text-slate-200 hover:text-[#00f0ff] transition-colors"
            title={store.pomodoro.isRunning ? 'Pause Timer' : 'Start Focus Timer'}
          >
            {store.pomodoro.isRunning ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => store.resetPomodoro()}
            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        {/* Mastery Box */}
        <div className="glass-panel px-3.5 py-2 rounded-lg flex items-center gap-2 font-mono text-xs shadow-lg">
          <Award size={14} className="text-[#00ff9d]" />
          <span className="text-slate-400">MASTERY:</span>
          <span className="text-[#00ff9d] font-bold">
            {store.diagnostics.masteryScore}%
          </span>
        </div>

        {/* Streak Box */}
        <div className="glass-panel px-3.5 py-2 rounded-lg flex items-center gap-2 font-mono text-xs shadow-lg">
          <Flame size={14} className="text-[#ffaa00]" />
          <span className="text-slate-400">STREAK:</span>
          <span className="text-[#ffaa00] font-bold">
            {store.diagnostics.streakDays} DAYS
          </span>
        </div>
      </footer>
    </div>
  );
}
