import math
import copy
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Tic-Tac-Toe AI")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Game Logic
# ----------------------------

X = "X"
O = "O"
EMPTY = None


def initial_state():
    return [[EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY]]


def player(board):
    x_count = sum(row.count(X) for row in board)
    o_count = sum(row.count(O) for row in board)
    return X if x_count <= o_count else O


def actions(board):
    possible_moves = set()
    for i in range(3):
        for j in range(3):
            if board[i][j] == EMPTY:
                possible_moves.add((i, j))
    return possible_moves


def result(board, action):
    if action not in actions(board):
        raise ValueError("Invalid action")
    new_board = copy.deepcopy(board)
    new_board[action[0]][action[1]] = player(board)
    return new_board


def winner(board):
    for i in range(3):
        if board[i][0] == board[i][1] == board[i][2] and board[i][0] is not None:
            return board[i][0]
        if board[0][i] == board[1][i] == board[2][i] and board[0][i] is not None:
            return board[0][i]
    if board[0][0] == board[1][1] == board[2][2] and board[0][0] is not None:
        return board[0][0]
    if board[0][2] == board[1][1] == board[2][0] and board[0][2] is not None:
        return board[0][2]
    return None


def terminal(board):
    if winner(board) is not None:
        return True
    for row in board:
        if EMPTY in row:
            return False
    return True


def utility(board):
    win_player = winner(board)
    if win_player == X:
        return 1
    elif win_player == O:
        return -1
    else:
        return 0


# ----------------------------
# Alpha-Beta Pruning AI
# ----------------------------

class AlphaBetaAI:
    def __init__(self):
        self.nodes_explored = 0

    def minimax_ab(self, board, max_depth=None):
        def max_value(state, alpha, beta, depth):
            self.nodes_explored += 1
            if terminal(state) or (max_depth is not None and depth >= max_depth):
                return utility(state), None
            v = -math.inf
            best_move = None
            for action in actions(state):
                min_val, _ = min_value(result(state, action), alpha, beta, depth + 1)
                if min_val > v:
                    v = min_val
                    best_move = action
                alpha = max(alpha, v)
                if alpha >= beta:
                    break
            return v, best_move

        def min_value(state, alpha, beta, depth):
            self.nodes_explored += 1
            if terminal(state) or (max_depth is not None and depth >= max_depth):
                return utility(state), None
            v = math.inf
            best_move = None
            for action in actions(state):
                max_val, _ = max_value(result(state, action), alpha, beta, depth + 1)
                if max_val < v:
                    v = max_val
                    best_move = action
                beta = min(beta, v)
                if beta <= alpha:
                    break
            return v, best_move

        self.nodes_explored = 0
        if terminal(board):
            return None, 0

        current_player = player(board)
        if current_player == X:
            _, move = max_value(board, -math.inf, math.inf, 0)
        else:
            _, move = min_value(board, -math.inf, math.inf, 0)

        return move, self.nodes_explored


# ----------------------------
# API Schema & Endpoint
# ----------------------------

# Board format: list of 3 rows, each a list of 3 cells ("X", "O", or null)
class MoveRequest(BaseModel):
    board: List[List[Optional[str]]]
    difficulty: str = "hard"   # "easy" | "medium" | "hard"

class MoveResponse(BaseModel):
    row: int
    col: int
    nodes_explored: int
    winner: Optional[str]
    is_terminal: bool


DIFFICULTY_DEPTH = {
    "easy": 1,
    "medium": 3,
    "hard": None,   # full search
}


@app.post("/move", response_model=MoveResponse)
def get_best_move(req: MoveRequest):
    board = req.board

    # Validate board shape
    if len(board) != 3 or any(len(row) != 3 for row in board):
        raise HTTPException(status_code=400, detail="Board must be 3x3")

    # Validate cell values
    valid = {X, O, None}
    for row in board:
        for cell in row:
            if cell not in valid:
                raise HTTPException(status_code=400, detail=f"Invalid cell value: {cell}")

    if terminal(board):
        raise HTTPException(status_code=400, detail="Game is already over")

    max_depth = DIFFICULTY_DEPTH.get(req.difficulty, None)
    ai = AlphaBetaAI()
    move, nodes = ai.minimax_ab(board, max_depth=max_depth)

    if move is None:
        raise HTTPException(status_code=500, detail="AI could not find a move")

    # Apply move and check result
    new_board = result(board, move)
    game_winner = winner(new_board)
    game_over = terminal(new_board)

    return MoveResponse(
        row=move[0],
        col=move[1],
        nodes_explored=nodes,
        winner=game_winner,
        is_terminal=game_over,
    )


@app.get("/")
def root():
    return {"message": "Tic-Tac-Toe AI API is running. POST to /move to play."}
