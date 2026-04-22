# Tic-Tac-Toe with Alpha-Beta Pruning

A simple, functional web application exploring adversarial search. This project implements a Minimax-based agent with Alpha-Beta pruning to handle game logic efficiently.

## Project Overview
The goal was to build a clean interface that connects a React frontend to a Python-based AI. Instead of checking every possible move, the agent uses pruning to skip unnecessary calculations, making the decision process much faster while maintaining optimal play.

## Key Features
* **Adversarial Search:** Uses the Minimax algorithm to evaluate board states.
* **Pruning Optimization:** Implements Alpha-Beta logic to reduce the number of nodes explored.
* **Live Metrics:** Displays how many nodes the AI evaluated before making a move.
* **Minimalist UI:** Built with React and Tailwind CSS for a smooth, distraction-free experience.

## Tech Stack
* **Frontend:** React.js, Tailwind CSS, Framer Motion
* **Backend:** FastAPI (Python)
* **Logic:** Python `math` and `copy` modules for state management

## Setup and Installation

### Backend
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Start the server: `uvicorn main:app --reload`

### Frontend
1. Navigate to the frontend directory: `cd frontend`
2. Install packages: `npm install`
3. Run the development server: `npm run dev`

---
**Maintained by [Usaid Raza](https://github.com/shaikhusaid)** **Student at FAST-NUCES **
