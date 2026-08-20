import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Clock,
  Calendar,
  Copy,
  Check,
  Terminal,
  Edit3,
  Eye,
  PenLine,
  Save,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { useStore } from '../../store/useStore';
import { getCategoryShade } from '../../utils/theme';

interface CodeBlockProps {
  language: string;
  codeString: string;
  nodeColor: string;
}

function CodeBlock({ language, codeString, nodeColor }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-white/10 bg-[#060a14] shadow-2xl">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/90 border-b border-white/10 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <Terminal size={12} style={{ color: nodeColor }} />
          <span className="font-bold tracking-wider" style={{ color: nodeColor }}>
            {language ? language.toUpperCase() : 'CODE'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 transition-colors border border-white/5 cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check size={11} className="text-[#00ff9d]" />
              <span className="text-[#00ff9d] font-bold">COPIED</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>COPY</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Body */}
      <div className="overflow-x-auto text-[11.5px] font-mono leading-relaxed">
        <SyntaxHighlighter
          language={language || 'text'}
          style={dracula}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '11.5px',
            lineHeight: '1.6'
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
            }
          }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export default function NoteViewerModal() {
  const activeNote = useStore((state) => state.activeNote);
  const setActiveNote = useStore((state) => state.setActiveNote);
  const isNoteEditing = useStore((state) => state.isNoteEditing);
  const setIsNoteEditing = useStore((state) => state.setIsNoteEditing);
  const addNoteToTopic = useStore((state) => state.addNoteToTopic);
  const updateNoteInTopic = useStore((state) => state.updateNoteInTopic);
  const deleteNoteFromTopic = useStore((state) => state.deleteNoteFromTopic);
  const selectedTopicId = useStore((state) => state.selectedTopicId);
  const topicNodes = useStore((state) => state.topicNodes);

  const [copied, setCopied] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTab, setEditTab] = useState<'WRITE' | 'PREVIEW'>('WRITE');

  const selectedNode = useMemo(
    () => topicNodes.find((n) => n.id === selectedTopicId),
    [topicNodes, selectedTopicId]
  );

  const nodeColor = useMemo(() => {
    if (!selectedNode) return '#00f0ff';
    return getCategoryShade(selectedNode.id, selectedNode.category);
  }, [selectedNode]);

  // Sync edit fields when activeNote changes
  useEffect(() => {
    if (activeNote) {
      setEditTitle(activeNote.title || 'Untitled Note');
      setEditContent(activeNote.content || '');
      setEditTab('WRITE');
    }
  }, [activeNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeNote) {
        handleCloseOrCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, isNoteEditing]);

  const handleCloseOrCancel = () => {
    if (isNoteEditing) {
      if (!activeNote?.id) {
        // Was creating a new note -> dismiss modal
        setActiveNote(null);
      } else {
        // Was editing existing note -> revert back to view mode
        setIsNoteEditing(false);
      }
    } else {
      setActiveNote(null);
    }
  };

  const handleSaveNote = () => {
    if (!selectedTopicId) return;
    const finalTitle = editTitle.trim() || 'Untitled Note';

    if (!activeNote?.id) {
      // Create new note
      addNoteToTopic(selectedTopicId, {
        title: finalTitle,
        content: editContent,
        updatedAt: 'Just now'
      });
    } else {
      // Update existing note
      updateNoteInTopic(selectedTopicId, {
        ...activeNote,
        title: finalTitle,
        content: editContent,
        updatedAt: 'Just now'
      });
    }
  };

  const handleDeleteCurrentNote = () => {
    if (!selectedTopicId || !activeNote?.id) return;
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteFromTopic(selectedTopicId, activeNote.id);
    }
  };

  const handleCopy = () => {
    const textToCopy = isNoteEditing ? editContent : activeNote?.content;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {activeNote && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 md:p-8 pointer-events-auto">
          {/* Backdrop Blur Overlay with rapid fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={handleCloseOrCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Glowing Modal Window with snappy, responsive Zoom-In Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderColor: `${nodeColor}70`,
              boxShadow: `0 0 50px ${nodeColor}35, 0 0 20px ${nodeColor}20, inset 0 0 20px ${nodeColor}08`
            }}
            className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-[#080c16]/95 border rounded-2xl overflow-hidden font-mono z-50 shadow-2xl"
          >
            {/* Top Accent Scanline Bar matched to node color */}
            <div
              className="h-1 w-full opacity-90 transition-all duration-300"
              style={{
                background: `linear-gradient(90deg, transparent, ${nodeColor}, transparent)`
              }}
            />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-slate-950/70 flex-shrink-0 gap-3">
              {isNoteEditing ? (
                /* Edit Mode Header */
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: `${nodeColor}18`,
                      borderColor: `${nodeColor}45`,
                      borderWidth: '1px',
                      color: nodeColor
                    }}
                  >
                    <Edit3 size={16} />
                  </div>
                  <div className="flex-1 max-w-sm">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Note title..."
                      className="w-full bg-slate-900/90 border border-white/20 focus:border-[#00f0ff] rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono font-bold focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              ) : (
                /* View Mode Header */
                <div className="flex items-center gap-3 truncate">
                  <div
                    className="p-2 rounded-lg flex-shrink-0 transition-all duration-300"
                    style={{
                      backgroundColor: `${nodeColor}18`,
                      borderColor: `${nodeColor}45`,
                      borderWidth: '1px',
                      color: nodeColor,
                      boxShadow: `0 0 12px ${nodeColor}35`
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div className="truncate">
                    <span className="text-slate-100 font-bold text-xs uppercase tracking-wider truncate">
                      {activeNote.title}
                    </span>
                  </div>
                </div>
              )}

              {/* Action & Mode Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isNoteEditing ? (
                  <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-white/10 text-[10px]">
                    <button
                      onClick={() => setEditTab('WRITE')}
                      style={{
                        backgroundColor: editTab === 'WRITE' ? `${nodeColor}25` : 'transparent',
                        color: editTab === 'WRITE' ? nodeColor : '#94a3b8'
                      }}
                      className="px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <PenLine size={11} />
                      <span>WRITE</span>
                    </button>
                    <button
                      onClick={() => setEditTab('PREVIEW')}
                      style={{
                        backgroundColor: editTab === 'PREVIEW' ? `${nodeColor}25` : 'transparent',
                        color: editTab === 'PREVIEW' ? nodeColor : '#94a3b8'
                      }}
                      className="px-2 py-1 rounded font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={11} />
                      <span>PREVIEW</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsNoteEditing(true)}
                    style={{
                      borderColor: `${nodeColor}40`,
                      color: nodeColor
                    }}
                    className="px-2.5 py-1 rounded-lg border bg-slate-900/60 hover:bg-slate-800 text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Edit Note"
                  >
                    <Edit3 size={13} />
                    <span>EDIT</span>
                  </button>
                )}

                <button
                  onClick={handleCloseOrCancel}
                  className="p-1.5 rounded-lg border border-white/10 hover:border-[#ff3366]/50 text-slate-400 hover:text-[#ff3366] bg-slate-900/60 hover:bg-[#ff3366]/10 transition-all cursor-pointer"
                  title="Close (ESC)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 overscroll-contain text-slate-200 selection:bg-white/20 selection:text-white flex flex-col min-h-[350px]">
              {isNoteEditing && editTab === 'WRITE' ? (
                /* Edit Mode: Markdown Textarea */
                <div className="flex-1 flex flex-col space-y-2 h-full">
                  <div className="flex items-center justify-end text-[10px] text-slate-400 font-mono">
                    <span>{editContent.length} characters</span>
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="Start typing your note here..."
                    className="w-full flex-1 min-h-[340px] p-4 rounded-xl bg-slate-950/80 border border-white/10 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#00f0ff]/60 resize-none selection:bg-white/20 selection:text-white placeholder:text-slate-600"
                    spellCheck={false}
                    autoFocus
                  />
                </div>
              ) : (
                /* View Mode or Live Preview Mode */
                <div className="flex-1">
                  {(isNoteEditing ? editContent : activeNote.content) ? (
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed font-mono">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                        components={{
                          h1: ({ node, ...props }) => (
                            <h1
                              className="text-base font-bold font-mono tracking-wider border-b pb-2 mb-4 mt-2 flex items-center gap-2"
                              style={{
                                color: nodeColor,
                                borderColor: `${nodeColor}30`
                              }}
                              {...props}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              className="text-sm font-bold text-slate-100 font-mono tracking-wide mt-6 mb-3 flex items-center gap-2"
                              {...props}
                            />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3
                              className="text-xs font-semibold font-mono tracking-wide mt-4 mb-2"
                              style={{ color: nodeColor }}
                              {...props}
                            />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="text-slate-300 text-xs leading-relaxed mb-3 font-mono" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside space-y-1.5 mb-4 text-slate-300 text-xs font-mono" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside space-y-1.5 mb-4 text-slate-300 text-xs font-mono" {...props} />
                          ),
                          li: ({ node, ...props }) => <li className="text-slate-300 text-xs font-mono leading-relaxed" {...props} />,
                          code: ({ node, className, children, ...props }) => {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            const isInline = !match && !String(children).includes('\n');
                            if (isInline) {
                              return (
                                <code
                                  className="px-1.5 py-0.5 rounded font-mono text-[11px]"
                                  style={{
                                    backgroundColor: `${nodeColor}15`,
                                    color: nodeColor,
                                    borderColor: `${nodeColor}30`,
                                    borderWidth: '1px'
                                  }}
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <CodeBlock
                                language={match ? match[1] : ''}
                                codeString={codeString}
                                nodeColor={nodeColor}
                              />
                            );
                          },
                          blockquote: ({ node, ...props }) => (
                            <blockquote
                              className="border-l-2 pl-3 py-1.5 text-slate-400 italic my-3 rounded-r font-mono text-xs"
                              style={{
                                borderLeftColor: nodeColor,
                                backgroundColor: `${nodeColor}0d`
                              }}
                              {...props}
                            />
                          ),
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto my-4 border border-white/10 rounded-lg">
                              <table className="w-full text-xs text-slate-300 border-collapse font-mono" {...props} />
                            </div>
                          ),
                          th: ({ node, ...props }) => (
                            <th
                              className="bg-slate-900 border-b border-white/10 p-2.5 text-left font-mono font-bold text-[11px]"
                              style={{ color: nodeColor }}
                              {...props}
                            />
                          ),
                          td: ({ node, ...props }) => (
                            <td
                              className="border-b border-white/5 p-2.5 font-mono text-[11px] bg-slate-950/40"
                              {...props}
                            />
                          ),
                          hr: ({ node, ...props }) => <hr className="border-white/10 my-4" {...props} />,
                          strong: ({ node, ...props }) => <strong className="text-slate-100 font-bold font-mono" {...props} />,
                          em: ({ node, ...props }) => (
                            <em className="not-italic font-medium font-mono" style={{ color: nodeColor }} {...props} />
                          )
                        }}
                      >
                        {isNoteEditing ? editContent : activeNote.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 font-mono text-xs">
                      <FileText size={24} className="mx-auto mb-2 text-slate-600" />
                      <p>This note file is currently empty.</p>
                      {isNoteEditing && (
                        <button
                          onClick={() => setEditTab('WRITE')}
                          className="mt-3 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                        >
                          Write Some Content
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-white/10 bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
              {isNoteEditing ? (
                /* Edit Mode Footer */
                <>
                  <div className="flex items-center gap-2">
                    {activeNote?.id && (
                      <button
                        onClick={handleDeleteCurrentNote}
                        className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Delete this note"
                      >
                        <Trash2 size={13} />
                        <span>DELETE</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCloseOrCancel}
                      className="px-3.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 text-xs font-mono font-semibold transition-all cursor-pointer"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleSaveNote}
                      style={{
                        borderColor: `${nodeColor}60`,
                        backgroundColor: `${nodeColor}20`,
                        color: nodeColor,
                        boxShadow: `0 0 16px ${nodeColor}25`
                      }}
                      className="px-4 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Save size={13} />
                      <span>SAVE NOTE</span>
                    </button>
                  </div>
                </>
              ) : (
                /* View Mode Footer */
                <div className="flex items-center justify-between w-full gap-4">
                  {/* Bottom-left: Date Added and Last Updated Info */}
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono flex-wrap">
                    {activeNote.createdAt && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={12} className="text-slate-500" />
                        <span>Added {activeNote.createdAt}</span>
                      </div>
                    )}
                    {activeNote.updatedAt && (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={12} className="text-slate-500" />
                        <span>Updated {activeNote.updatedAt}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom-right: Copy Action Button */}
                  <button
                    onClick={handleCopy}
                    style={{
                      borderColor: copied ? '#00ff9d' : `${nodeColor}50`,
                      backgroundColor: copied ? 'rgba(0, 255, 157, 0.12)' : 'rgba(8, 12, 22, 0.85)',
                      color: copied ? '#00ff9d' : '#f1f5f9'
                    }}
                    className="px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-2 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 cursor-pointer shadow-sm flex-shrink-0"
                    title="Copy note content"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-[#00ff9d]" />
                        <span className="text-[#00ff9d]">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} style={{ color: nodeColor }} />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
