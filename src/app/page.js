'use client'

import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <main className="h-screen flex flex-col justify-center items-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="font-mono font-bold text-7xl mb-8 text-center"
      >
        AlphaEvolve-lite
      </motion.h1>

      <motion.button 
      className="bg-black hover:bg-black/80 text-white font-bold py-2 px-4 rounded-full"
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      transition={{duration: 2}}>
        Try now
      </motion.button>
    </main>
  )
}
