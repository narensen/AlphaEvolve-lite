'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, ArrowLeft, Copy, Check } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Link from "next/link"

export default function ConversationPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusUpdates, setStatusUpdates] = useState([])
  const [copiedCode, setCopiedCode] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const eventSourceRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => scrollToBottom(), [messages])

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStatusUpdates([])

    // Close any existing EventSource connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      // Use the streaming endpoint for real-time status updates
      const response = await fetch("https://ae-backend-kel6.onrender.com/generate-stream", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content })
      })

      if (!response.ok) throw new Error('Failed to generate response')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'status') {
                setStatusUpdates(prev => [...prev, data.message])
              } else if (data.type === 'result') {
                const assistantMessage = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: data.content,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, assistantMessage])
                setIsLoading(false)
              } else if (data.type === 'error') {
                setStatusUpdates(prev => [...prev, data.message])
                const errorMessage = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: 'Sorry, an error occurred. Please try again.',
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, errorMessage])
                setIsLoading(false)
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      setStatusUpdates(prev => [...prev, `Error: ${error.message}`])
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, an error occurred. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => adjustTextareaHeight(), [input])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-6 border-b border-white/10 backdrop-blur-sm bg-black/20 sticky top-0 z-10"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                AlphaEvolve-lite
              </h1>
              <p className="text-xs text-gray-400 mt-1">Flash + Pro Fusion Engine</p>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Online</span>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {messages.length === 0 && !isLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 md:py-24"
              >
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <div className="w-8 h-8 bg-white rounded-lg"></div>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                    Ready to evolve your prompts
                  </h2>
                  <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                    Experience the power of dual <span className="text-white font-semibold">Gemini model fusion</span>. 
                    Fast iterations, deep analysis, cohesive results.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-12">
                  {[
                    { title: "Lightning Fast", desc: "Flash model for rapid responses" },
                    { title: "Deep Analysis", desc: "Pro model for complex reasoning" },
                    { title: "Unified Output", desc: "Seamless fusion of both models" }
                  ].map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-400">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-4xl w-full ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                        <div className={`group relative ${message.role === 'user' ? 'max-w-2xl' : 'w-full'}`}>
                          {/* Role indicator */}
                          <div className={`flex items-center gap-2 mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-center gap-2 text-xs font-medium ${
                              message.role === 'user' ? 'text-gray-400' : 'text-gray-300'
                            }`}>
                              {message.role === 'user' ? (
                                <>
                                  <span>You</span>
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">U</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">A</span>
                                  </div>
                                  <span>AlphaEvolve-lite</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Message content */}
                          <div className={`rounded-2xl px-6 py-5 shadow-lg transition-all duration-300 ${
                            message.role === 'user' 
                              ? 'bg-gradient-to-br from-blue-600 to-purple-700 text-white border border-blue-500/30 shadow-blue-500/20' 
                              : 'bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-white/10 hover:border-white/20 shadow-black/50'
                          }`}>
                            <div className={`prose prose-invert max-w-none ${message.role === 'user' ? 'prose-headings:text-white prose-p:text-white' : ''}`}>
                              <ReactMarkdown
                                components={{
                                  code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const codeString = String(children).replace(/\n$/, '')
                                    
                                    return !inline && match ? (
                                      <div className="relative group/code">
                                        <div className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-t-lg border-b border-gray-700">
                                          <span className="text-sm text-gray-400 font-medium">{match[1]}</span>
                                          <Button
                                            onClick={() => copyToClipboard(codeString)}
                                            className="opacity-0 group-hover/code:opacity-100 transition-opacity p-1 h-auto bg-transparent hover:bg-gray-700 text-gray-400 hover:text-white"
                                          >
                                            {copiedCode === codeString ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </Button>
                                        </div>
                                        <SyntaxHighlighter
                                          style={oneDark}
                                          language={match[1]}
                                          PreTag="div"
                                          className="!bg-gray-950 !mt-0 !mb-4 rounded-t-none !rounded-b-lg"
                                          showLineNumbers={codeString.split('\n').length > 5}
                                          {...props}
                                        >
                                          {codeString}
                                        </SyntaxHighlighter>
                                      </div>
                                    ) : (
                                      <code className={`px-2 py-1 rounded-md text-sm font-mono ${
                                        message.role === 'user' 
                                          ? 'bg-black/20 text-white border border-white/20' 
                                          : 'bg-gray-800 text-green-400 border border-gray-600'
                                      }`} {...props}>
                                        {children}
                                      </code>
                                    )
                                  },
                                  h1: ({ children }) => (
                                    <h1 className={`text-2xl font-bold mb-4 pb-2 border-b ${
                                      message.role === 'user' ? 'text-white border-white/30' : 'text-white border-gray-600'
                                    }`}>
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className={`text-xl font-bold mb-3 ${
                                      message.role === 'user' ? 'text-white' : 'text-gray-100'
                                    }`}>
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className={`text-lg font-semibold mb-2 ${
                                      message.role === 'user' ? 'text-white' : 'text-gray-200'
                                    }`}>
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className={`mb-4 leading-relaxed ${
                                      message.role === 'user' ? 'text-white' : 'text-gray-300'
                                    }`}>
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="mb-4 space-y-2 pl-4">{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="mb-4 space-y-2 pl-4">{children}</ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className={`leading-relaxed ${
                                      message.role === 'user' ? 'text-white' : 'text-gray-300'
                                    } marker:text-gray-500`}>
                                      {children}
                                    </li>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className={`border-l-4 pl-4 italic my-4 ${
                                      message.role === 'user' 
                                        ? 'border-white/30 text-white/90' 
                                        : 'border-gray-500 text-gray-400'
                                    }`}>
                                      {children}
                                    </blockquote>
                                  ),
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-4">
                                      <table className="min-w-full border border-gray-600 rounded-lg">
                                        {children}
                                      </table>
                                    </div>
                                  ),
                                  th: ({ children }) => (
                                    <th className="border border-gray-600 px-4 py-2 bg-gray-800 text-left font-semibold text-white">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="border border-gray-600 px-4 py-2 text-gray-300">
                                      {children}
                                    </td>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            
                            {/* Timestamp */}
                            <div className={`text-xs mt-4 pt-2 border-t font-medium ${
                              message.role === 'user' 
                                ? 'text-white/70 border-white/20' 
                                : 'text-gray-500 border-white/10'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Enhanced Status Updates - No Scroll, Expansion Instead */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-start"
                  >
                    <div className="w-full max-w-4xl">
                      {/* Role indicator */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-300">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <Loader2 className="w-3 h-3 text-white animate-spin" />
                          </div>
                          <span>AlphaEvolve-lite</span>
                        </div>
                      </div>

                      {/* Status content */}
                      <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-5 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm font-semibold text-white">Processing with Fusion Engine</span>
                        </div>
                        
                        {/* Status updates with expansion instead of scroll */}
                        <AnimatePresence>
                          <div className="space-y-3">
                            {statusUpdates.map((status, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ 
                                  duration: 0.3,
                                  delay: idx * 0.05,
                                  ease: "easeOut"
                                }}
                                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                                  idx === statusUpdates.length - 1 
                                    ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                                    : 'bg-gray-800/50 text-gray-400'
                                }`}
                              >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  idx === statusUpdates.length - 1 
                                    ? 'bg-green-400 animate-pulse' 
                                    : 'bg-gray-600'
                                }`} />
                                <span className="text-sm font-medium">{status}</span>
                                {idx === statusUpdates.length - 1 && (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full"
                                  />
                                )}
                              </motion.div>
                            ))}
                          </div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Clean Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 p-4 md:p-6"
        >
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <div className="relative rounded-2xl border border-white/20 focus-within:border-white/40 transition-all duration-300">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AlphaEvolve-lite anything..."
                  className="w-full bg-transparent px-6 py-4 pr-16 text-white placeholder-gray-400 focus:outline-none text-lg leading-relaxed resize-none overflow-hidden"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-white to-gray-200 text-black hover:from-gray-200 hover:to-gray-300 disabled:from-gray-700 disabled:to-gray-600 disabled:text-gray-400 rounded-full w-12 h-12 p-0 transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-400 mt-3">
                <span className="font-medium">
                  Press <kbd className="px-2 py-1 bg-gray-800 rounded text-white text-xs">Enter</kbd> to send, 
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-white text-xs ml-1">Shift+Enter</kbd> for new line
                </span>
                <span className="text-xs">
                  Powered by Gemini Fusion
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}