'use client'

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4 py-12">
      
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-6xl sm:text-7xl font-extrabold text-center leading-tight"
      >
        AlphaEvolve-lite
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.3, delay: 0.3 }}
        className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl text-center"
      >
        The open-source LLM fusion engine. Combines <span className="text-white">Gemini Flash</span> and <span className="text-white">Gemini Pro</span> to generate fast, layered answers to complex prompts.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.6 }}
        className="mt-10"
      >
        <Link href="/home"><Button className="bg-white text-black font-semibold px-6 py-3 rounded-full hover:bg-white/90 transition">
          Try Now
        </Button></Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.8, delay: 1.2 }}
        className="mt-20 max-w-3xl text-center text-gray-400 text-sm sm:text-base px-6"
      >
        <p>
          AlphaEvolve-lite processes your prompt with both Gemini models, iterates on Flash, merges insights via Pro, and returns one cohesive solution. 
          No noise. No hallucinated code blocks. Just raw, actionable GenAI.
        </p>

        <p className="mt-4 italic text-gray-500">
          Coming soon: API endpoints, auth system, and memory-chained context.
        </p>
      </motion.div>

    </main>
  )
}
