'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, ArrowLeft } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import Link from "next/link"

export default function ConversationPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusUpdates, setStatusUpdates] = useState([])
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const eventSourceRef = useRef(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })

  useEffect(() => scrollToBottom(), [messages, statusUpdates])

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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 border-b border-white/10"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-extrabold">AlphaEvolve-lite</h1>
          </div>
          <div className="text-sm text-gray-400 font-medium">
            Flash + Pro Fusion Engine
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {messages.length === 0 && !isLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24"
              >
                <h2 className="text-4xl font-extrabold mb-6">Ready to evolve your prompts</h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  Experience the power of dual <span className="text-white">Gemini model fusion</span>. 
                  Fast iterations, deep analysis, cohesive results.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-4xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`rounded-2xl px-6 py-4 ${
                          message.role === 'user' 
                            ? 'bg-white text-black border border-white' 
                            : 'bg-black border border-white/20'
                        }`}>
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                code({ node, inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      PreTag="div"
                                      className="rounded-lg !bg-gray-950 !mt-4 !mb-4"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={`px-2 py-1 rounded text-sm font-mono ${
                                      message.role === 'user' ? 'bg-black/10 text-black' : 'bg-white/10 text-white'
                                    }`} {...props}>
                                      {children}
                                    </code>
                                  )
                                },
                                h1: ({ children }) => <h1 className={`text-2xl font-bold mb-4 ${
                                  message.role === 'user' ? 'text-black' : 'text-white'
                                }`}>{children}</h1>,
                                h2: ({ children }) => <h2 className={`text-xl font-bold mb-3 ${
                                  message.role === 'user' ? 'text-black' : 'text-white'
                                }`}>{children}</h2>,
                                h3: ({ children }) => <h3 className={`text-lg font-semibold mb-2 ${
                                  message.role === 'user' ? 'text-black' : 'text-white'
                                }`}>{children}</h3>,
                                p: ({ children }) => <p className={`mb-4 leading-relaxed ${
                                  message.role === 'user' ? 'text-black' : 'text-white'
                                }`}>{children}</p>,
                                ul: ({ children }) => <ul className="mb-4 space-y-2">{children}</ul>,
                                li: ({ children }) => <li className={`leading-relaxed ${
                                  message.role === 'user' ? 'text-black' : 'text-white'
                                }`}>{children}</li>,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          <div className={`text-xs mt-3 font-medium ${
                            message.role === 'user' ? 'text-black/60' : 'text-white/60'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Real-time Status Updates */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-black border border-white/20 rounded-2xl px-6 py-4 max-w-2xl">
                      <div className="flex items-center space-x-3 mb-3">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <span className="text-sm font-semibold text-white">AlphaEvolve-lite Processing</span>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {statusUpdates.map((status, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`text-sm flex items-center space-x-2 ${
                              idx === statusUpdates.length - 1 ? 'text-white' : 'text-gray-400'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              idx === statusUpdates.length - 1 ? 'bg-white animate-pulse' : 'bg-gray-600'
                            }`} />
                            <span>{status}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 p-6 bg-black"
        >
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <div className="relative bg-black rounded-2xl border border-white/20 focus-within:border-white/40 transition-all duration-200">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask AlphaEvolve-lite anything..."
                  className="w-full bg-transparent px-6 py-4 pr-16 text-white placeholder-gray-400 resize-none focus:outline-none text-lg"
                  style={{ minHeight: '60px', maxHeight: '120px' }}
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white text-black hover:bg-gray-200 disabled:bg-gray-700 disabled:text-gray-500 rounded-full w-10 h-10 p-0 transition-all duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="text-sm text-gray-400 mt-3 text-center font-medium">
                Press <span className="text-white">Enter</span> to send, <span className="text-white">Shift+Enter</span> for new line
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}