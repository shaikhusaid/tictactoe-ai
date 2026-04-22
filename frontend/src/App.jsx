import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Config ──────────────────────────────────────────────────────────────────
const API_URL = "http://127.0.0.1:8000/move";
const EMPTY = null;

const initialBoard = () => [
  [EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY],
  [EMPTY, EMPTY, EMPTY],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function checkWinner(board) {
  const lines = [
    [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
    [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
    [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]],
  ];
  for (const line of lines) {
    const [a, b, c] = line;
    const va = board[a[0]][a[1]], vb = board[b[0]][b[1]], vc = board[c[0]][c[1]];
    if (va && va === vb && va === vc) return { winner: va, line };
  }
  if (board.every(row => row.every(cell => cell !== EMPTY))) return { winner: "draw", line: [] };
  return null;
}

// ─── Symbols ─────────────────────────────────────────────────────────────────
function XSymbol() {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
      <motion.line
        x1="8" y1="8" x2="32" y2="32"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      />
      <motion.line
        x1="32" y1="8" x2="8" y2="32"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, ease: "easeOut", delay: 0.1 }}
      />
    </svg>
  );
}

function OSymbol() {
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
      <motion.circle
        cx="20" cy="20" r="12"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        style={{ pathLength: 1 }}
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TicTacToe() {
  const [board, setBoard] = useState(initialBoard());
  const [status, setStatus] = useState("idle"); // idle | thinking | over
  const [result, setResult] = useState(null);    // null | {winner, line}
  const [difficulty, setDifficulty] = useState("hard");
  const [score, setScore] = useState({ human: 0, ai: 0, draw: 0 });
  const [nodes, setNodes] = useState(null);
  const [lastAiCell, setLastAiCell] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isOver = status === "over";

  // ── Call AI ─────────────────────────────────────────────────────────────────
  const fetchAiMove = useCallback(async (currentBoard) => {
    setStatus("thinking");
    setErrorMsg(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Board sent as list-of-lists with null for empty cells
        body: JSON.stringify({ board: currentBoard, difficulty }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
      }
      const data = await res.json();
      const newBoard = currentBoard.map(r => [...r]);
      newBoard[data.row][data.col] = "O";
      setBoard(newBoard);
      setLastAiCell(`${data.row}-${data.col}`);
      setNodes(data.nodes_explored);

      const outcome = checkWinner(newBoard);
      if (outcome) {
        setResult(outcome);
        setStatus("over");
        if (outcome.winner === "O") setScore(s => ({ ...s, ai: s.ai + 1 }));
        else if (outcome.winner === "draw") setScore(s => ({ ...s, draw: s.draw + 1 }));
      } else {
        setStatus("idle");
      }
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("idle");
    }
  }, [difficulty]);

  // ── Human Move ──────────────────────────────────────────────────────────────
  const handleClick = useCallback((r, c) => {
    if (board[r][c] !== EMPTY || status !== "idle") return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = "X";
    setBoard(newBoard);
    setLastAiCell(null);

    const outcome = checkWinner(newBoard);
    if (outcome) {
      setResult(outcome);
      setStatus("over");
      if (outcome.winner === "X") setScore(s => ({ ...s, human: s.human + 1 }));
      else if (outcome.winner === "draw") setScore(s => ({ ...s, draw: s.draw + 1 }));
      return;
    }
    fetchAiMove(newBoard);
  }, [board, status, fetchAiMove]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const reset = () => {
    setBoard(initialBoard());
    setStatus("idle");
    setResult(null);
    setLastAiCell(null);
    setNodes(null);
    setErrorMsg(null);
  };

  // ── Winning cells set ───────────────────────────────────────────────────────
  const winCells = new Set(result?.line?.map(([r, c]) => `${r}-${c}`) ?? []);

  // ── Status message ──────────────────────────────────────────────────────────
  const statusText = isOver
    ? result?.winner === "draw" ? "It's a draw!" : result?.winner === "X" ? "You won! 🎉" : "AI wins!"
    : status === "thinking" ? "AI is thinking…" : "Your turn (X)";

  return (
    <>
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          min-height: 100vh;
          background: #080b14;
          font-family: 'Syne', sans-serif;
          overflow-x: hidden;
        }

        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
        }

        /* ── Ambient blobs ── */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 { width: 600px; height: 600px; background: #4f6ef7; top: -15%; left: -15%; }
        .blob-2 { width: 500px; height: 500px; background: #a855f7; bottom: -10%; right: -10%; }
        .blob-3 { width: 350px; height: 350px; background: #06b6d4; top: 40%; left: 55%; }

        /* ── Glass card ── */
        .glass {
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 28px;
          box-shadow: 0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
        }

        /* ── Title ── */
        .title {
          font-size: clamp(2rem, 6vw, 3.2rem);
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #e0e7ff 30%, #818cf8 70%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.2rem;
    
        }
        .subtitle {
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          margin-bottom: 2rem;
        }

        /* ── Score card ── */
        .scoreboard {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.8rem;
        }
        .score-pill {
          padding: 0.55rem 1.2rem;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
          min-width: 70px;
        }
        .score-pill .label { font-size: 0.62rem; opacity: 0.55; font-weight: 400; font-family: 'DM Mono', monospace; }
        .score-pill .val { font-size: 1.4rem; line-height: 1; }
        .score-human  { background: rgba(99,179,237,0.12); border: 1px solid rgba(99,179,237,0.25); color: #7dd3fc; }
        .score-draw   { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.55); }
        .score-ai     { background: rgba(192,132,252,0.12); border: 1px solid rgba(192,132,252,0.25); color: #c084fc; }

        /* ── Difficulty ── */
        .difficulty {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 1.6rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 0.3rem;
        }
        .diff-btn {
          padding: 0.35rem 1rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.4);
          transition: all 0.2s;
          font-family: 'DM Mono', monospace;
        }
        .diff-btn.active {
          background: rgba(129,140,248,0.25);
          color: #a5b4fc;
          box-shadow: 0 0 12px rgba(129,140,248,0.2);
        }
        .diff-btn:not(.active):hover { color: rgba(255,255,255,0.7); }

        /* ── Board ── */
        .board-wrap {
          padding: 1.8rem;
          margin-bottom: 1.6rem;
        }
        .board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .cell {
          width: clamp(80px, 20vw, 108px);
          height: clamp(80px, 20vw, 108px);
          border-radius: 16px;
          background: rgba(255,255,255,0.045);
          border: 1.5px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.12s;
          padding: 18px;
          position: relative;
          overflow: hidden;
        }
        .cell:hover:not(.filled):not(.over) {
          background: rgba(255,255,255,0.085);
          border-color: rgba(129,140,248,0.3);
          transform: scale(1.03);
        }
        .cell.filled { cursor: default; }
        .cell.over { cursor: default; }
        .cell.winning {
          background: rgba(129,140,248,0.15);
          border-color: rgba(129,140,248,0.5);
          box-shadow: 0 0 20px rgba(129,140,248,0.2);
        }
        .cell.x-cell { color: #7dd3fc; }
        .cell.o-cell { color: #c084fc; }

        /* ── Status ── */
        .status-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          min-height: 28px;
        }
        .status-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.65);
        }
        .status-text.over-win  { color: #86efac; }
        .status-text.over-lose { color: #fca5a5; }
        .status-text.over-draw { color: rgba(255,255,255,0.55); }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.15);
          border-top-color: #818cf8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Buttons ── */
        .btn-reset {
          padding: 0.7rem 2.2rem;
          border-radius: 999px;
          font-family: 'Syne', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          cursor: pointer;
          border: 1.5px solid rgba(129,140,248,0.4);
          background: rgba(129,140,248,0.1);
          color: #a5b4fc;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .btn-reset:hover {
          background: rgba(129,140,248,0.22);
          border-color: rgba(129,140,248,0.7);
          box-shadow: 0 0 18px rgba(129,140,248,0.25);
          transform: translateY(-1px);
        }

        /* ── Node counter ── */
        .node-count {
          margin-top: 1rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.06em;
        }

        /* ── Error ── */
        .error-box {
          background: rgba(248,113,113,0.1);
          border: 1px solid rgba(248,113,113,0.3);
          color: #fca5a5;
          border-radius: 12px;
          padding: 0.6rem 1rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          margin-bottom: 1rem;
          max-width: 320px;
          text-align: center;
        }
      `}</style>

      <div className="app">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ textAlign: "center" }}
        >
          <div className="title">Tic·Tac·Toe</div>
          <div className="subtitle">Alpha-Beta Pruning AI</div>
        </motion.div>

        {/* ── Scoreboard ── */}
        <motion.div
          className="scoreboard"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="score-pill score-human">
            <span className="label">YOU</span>
            <motion.span className="val" key={score.human} animate={{ scale: [1.4, 1] }} transition={{ duration: 0.3 }}>
              {score.human}
            </motion.span>
          </div>
          <div className="score-pill score-draw">
            <span className="label">DRAW</span>
            <motion.span className="val" key={score.draw} animate={{ scale: [1.4, 1] }} transition={{ duration: 0.3 }}>
              {score.draw}
            </motion.span>
          </div>
          <div className="score-pill score-ai">
            <span className="label">AI</span>
            <motion.span className="val" key={score.ai} animate={{ scale: [1.4, 1] }} transition={{ duration: 0.3 }}>
              {score.ai}
            </motion.span>
          </div>
        </motion.div>

        {/* ── Difficulty ── */}
        <motion.div
          className="difficulty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {["easy", "medium", "hard"].map(d => (
            <button
              key={d}
              className={`diff-btn${difficulty === d ? " active" : ""}`}
              onClick={() => { setDifficulty(d); reset(); }}
              disabled={status === "thinking"}
            >
              {d}
            </button>
          ))}
        </motion.div>

        {/* ── Error ── */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              className="error-box"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ⚠ {errorMsg} — is the backend running?
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Board ── */}
        <motion.div
          className="glass board-wrap"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="board">
            {board.map((row, r) =>
              row.map((cell, c) => {
                const key = `${r}-${c}`;
                const isWin = winCells.has(key);
                const isAiLast = lastAiCell === key;
                return (
                  <motion.div
                    key={key}
                    className={[
                      "cell",
                      cell ? "filled" : "",
                      isOver ? "over" : "",
                      isWin ? "winning" : "",
                      cell === "X" ? "x-cell" : cell === "O" ? "o-cell" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => handleClick(r, c)}
                    whileTap={!cell && !isOver ? { scale: 0.93 } : {}}
                    animate={isAiLast ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AnimatePresence>
                      {cell === "X" && (
                        <motion.div
                          key="x"
                          style={{ width: "100%", height: "100%" }}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <XSymbol />
                        </motion.div>
                      )}
                      {cell === "O" && (
                        <motion.div
                          key="o"
                          style={{ width: "100%", height: "100%" }}
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                          <OSymbol />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ── Status ── */}
        <div className="status-row">
          {status === "thinking" && <div className="spinner" />}
          <AnimatePresence mode="wait">
            <motion.span
              key={statusText}
              className={[
                "status-text",
                isOver && result?.winner === "X" ? "over-win" : "",
                isOver && result?.winner === "O" ? "over-lose" : "",
                isOver && result?.winner === "draw" ? "over-draw" : "",
              ].join(" ")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {statusText}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* ── Reset button ── */}
        <motion.button
          className="btn-reset"
          onClick={reset}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset Game
        </motion.button>

        {/* ── Node counter ── */}
        <AnimatePresence>
          {nodes !== null && (
            <motion.div
              className="node-count"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {nodes.toLocaleString()} nodes explored
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
