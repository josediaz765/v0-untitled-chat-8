"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Gamepad2, Car, Bird } from "lucide-react"
import { Button } from "@/components/ui/button"

// Simple Car Dodge Game
function CarGame({ isActive }) {
  const [carPosition, setCarPosition] = useState(1)
  const [obstacles, setObstacles] = useState([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const gameRef = useRef(null)

  const resetGame = () => {
    setCarPosition(1)
    setObstacles([])
    setScore(0)
    setGameOver(false)
  }

  const moveCar = useCallback(
    (direction) => {
      if (gameOver) return
      setCarPosition((prev) => {
        if (direction === "left" && prev > 0) return prev - 1
        if (direction === "right" && prev < 2) return prev + 1
        return prev
      })
    },
    [gameOver],
  )

  useEffect(() => {
    if (!isActive || gameOver) return

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") moveCar("left")
      if (e.key === "ArrowRight" || e.key === "d") moveCar("right")
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, gameOver, moveCar])

  useEffect(() => {
    if (!isActive || gameOver) return

    const spawnInterval = setInterval(() => {
      const lane = Math.floor(Math.random() * 3)
      setObstacles((prev) => [...prev, { id: Date.now(), lane, y: 0 }])
    }, 1200)

    return () => clearInterval(spawnInterval)
  }, [isActive, gameOver])

  useEffect(() => {
    if (!isActive || gameOver) return

    const moveInterval = setInterval(() => {
      setObstacles((prev) => {
        const updated = prev.map((o) => ({ ...o, y: o.y + 1 })).filter((o) => o.y < 6)

        // Check collision
        const collision = updated.some((o) => o.y === 4 && o.lane === carPosition)
        if (collision) {
          setGameOver(true)
          return []
        }

        // Score for passed obstacles
        const passed = prev.filter((o) => o.y === 4 && o.lane !== carPosition).length
        if (passed > 0) setScore((s) => s + passed * 10)

        return updated
      })
    }, 300)

    return () => clearInterval(moveInterval)
  }, [isActive, gameOver, carPosition])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-cyan-400 font-mono">Score: {score}</div>

      <div
        ref={gameRef}
        className="relative w-[90px] h-[120px] bg-slate-800 rounded-lg overflow-hidden border border-slate-600"
      >
        {/* Road lanes */}
        <div className="absolute inset-0 flex">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 border-x border-dashed border-slate-600/50" />
          ))}
        </div>

        {/* Obstacles */}
        {obstacles.map((o) => (
          <div
            key={o.id}
            className="absolute w-[28px] h-[20px] bg-red-500 rounded transition-all duration-200"
            style={{
              left: `${o.lane * 30 + 1}px`,
              top: `${o.y * 20}px`,
            }}
          />
        ))}

        {/* Player car */}
        <div
          className="absolute bottom-1 w-[28px] h-[20px] bg-cyan-400 rounded transition-all duration-150"
          style={{ left: `${carPosition * 30 + 1}px` }}
        />

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <p className="text-red-400 text-xs font-bold">CRASH!</p>
            <p className="text-white text-[10px]">{score} pts</p>
            <Button size="sm" onClick={resetGame} className="mt-1 h-5 text-[10px] px-2">
              Retry
            </Button>
          </div>
        )}
      </div>

      {/* Mobile controls */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 border-slate-600 bg-transparent"
          onClick={() => moveCar("left")}
        >
          ←
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 border-slate-600 bg-transparent"
          onClick={() => moveCar("right")}
        >
          →
        </Button>
      </div>
      <p className="text-[10px] text-slate-500">Arrow keys or buttons</p>
    </div>
  )
}

// Flappy Bird Style Game
function FlappyGame({ isActive }) {
  const [birdY, setBirdY] = useState(50)
  const [velocity, setVelocity] = useState(0)
  const [pipes, setPipes] = useState([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)

  const resetGame = () => {
    setBirdY(50)
    setVelocity(0)
    setPipes([])
    setScore(0)
    setGameOver(false)
    setStarted(false)
  }

  const jump = useCallback(() => {
    if (gameOver) return
    if (!started) setStarted(true)
    setVelocity(-8)
  }, [gameOver, started])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault()
        jump()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isActive, jump])

  useEffect(() => {
    if (!isActive || !started || gameOver) return

    const gameLoop = setInterval(() => {
      // Gravity
      setVelocity((v) => Math.min(v + 1.5, 8))
      setBirdY((y) => {
        const newY = y + velocity
        if (newY <= 0 || newY >= 95) {
          setGameOver(true)
          return y
        }
        return newY
      })

      // Move pipes
      setPipes((prev) => {
        const updated = prev.map((p) => ({ ...p, x: p.x - 5 })).filter((p) => p.x > -15)

        // Check collision
        const birdLeft = 15
        const birdRight = 30
        const birdTop = birdY
        const birdBottom = birdY + 10

        for (const pipe of updated) {
          if (pipe.x < birdRight && pipe.x + 12 > birdLeft) {
            if (birdTop < pipe.gapY || birdBottom > pipe.gapY + 25) {
              setGameOver(true)
              break
            }
          }
          // Score
          if (pipe.x + 12 < birdLeft && !pipe.scored) {
            pipe.scored = true
            setScore((s) => s + 1)
          }
        }

        return updated
      })
    }, 80)

    return () => clearInterval(gameLoop)
  }, [isActive, started, gameOver, velocity, birdY])

  useEffect(() => {
    if (!isActive || !started || gameOver) return

    const spawnInterval = setInterval(() => {
      const gapY = 15 + Math.random() * 45
      setPipes((prev) => [...prev, { id: Date.now(), x: 100, gapY }])
    }, 2000)

    return () => clearInterval(spawnInterval)
  }, [isActive, started, gameOver])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs text-teal-400 font-mono">Score: {score}</div>

      <div
        className="relative w-[100px] h-[120px] bg-gradient-to-b from-sky-900 to-sky-700 rounded-lg overflow-hidden border border-slate-600 cursor-pointer"
        onClick={jump}
      >
        {/* Bird */}
        <div
          className="absolute w-[15px] h-[10px] bg-yellow-400 rounded-full transition-all duration-75"
          style={{ left: "15px", top: `${birdY}%` }}
        />

        {/* Pipes */}
        {pipes.map((p) => (
          <React.Fragment key={p.id}>
            {/* Top pipe */}
            <div
              className="absolute w-[12px] bg-green-500 rounded-b"
              style={{
                left: `${p.x}%`,
                top: 0,
                height: `${p.gapY}%`,
              }}
            />
            {/* Bottom pipe */}
            <div
              className="absolute w-[12px] bg-green-500 rounded-t"
              style={{
                left: `${p.x}%`,
                top: `${p.gapY + 25}%`,
                bottom: 0,
              }}
            />
          </React.Fragment>
        ))}

        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <p className="text-white text-[10px] text-center">
              Tap or
              <br />
              Space
            </p>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <p className="text-red-400 text-xs font-bold">Game Over</p>
            <p className="text-white text-[10px]">{score} pts</p>
            <Button size="sm" onClick={resetGame} className="mt-1 h-5 text-[10px] px-2">
              Retry
            </Button>
          </div>
        )}
      </div>

      <Button size="sm" variant="outline" className="h-8 px-4 border-slate-600 bg-transparent" onClick={jump}>
        Jump
      </Button>
      <p className="text-[10px] text-slate-500">Space/Tap to jump</p>
    </div>
  )
}

export default function MiniGames() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeGame, setActiveGame] = useState("car")

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-50 p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <Gamepad2 className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Game widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "auto" : "auto",
            }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-4 right-4 z-50 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
            style={{ width: isMinimized ? "160px" : "160px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700">
              <div className="flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs font-medium text-slate-300">Mini Games</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <Minus className="w-3 h-3 text-slate-400" />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-red-500/20 rounded transition-colors">
                  <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-3"
                >
                  {/* Game tabs */}
                  <div className="flex gap-1 mb-3">
                    <button
                      onClick={() => setActiveGame("car")}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
                        activeGame === "car"
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Car className="w-3 h-3" />
                      Car
                    </button>
                    <button
                      onClick={() => setActiveGame("flappy")}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${
                        activeGame === "flappy"
                          ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Bird className="w-3 h-3" />
                      Flappy
                    </button>
                  </div>

                  {/* Active game */}
                  {activeGame === "car" && <CarGame isActive={isOpen && !isMinimized} />}
                  {activeGame === "flappy" && <FlappyGame isActive={isOpen && !isMinimized} />}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
