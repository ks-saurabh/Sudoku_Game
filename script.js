const board = Array.from({ length: 9 }, () => Array(9).fill(0));
let selectedCell = null;

// Save current board to localStorage
function saveGame() {
    localStorage.setItem("sudoku-board", JSON.stringify(board));
}

// Load board from localStorage
function loadGame() {
    const saved = localStorage.getItem("sudoku-board");
    if (saved) {
        const savedBoard = JSON.parse(saved);
        renderBoard(savedBoard);
        return true;
    }
    return false;
}

// Fetch new puzzle from API
async function getPuzzle() {
    try {
        const res = await fetch("https://sugoku.onrender.com/board?difficulty=easy");
        const data = await res.json();
        const puzzle = data.board;
        renderBoard(puzzle);
        saveGame();
    } catch (err) {
        console.error("Error fetching puzzle:", err);
    }
}

// Render puzzle on board
function renderBoard(puzzle) {
    for (let i = 0; i < 81; i++) {
        let row = Math.floor(i / 9);
        let col = i % 9;
        board[row][col] = puzzle[row][col];

        const cell = document.getElementById(i);
        cell.textContent = puzzle[row][col] !== 0 ? puzzle[row][col] : "";
        cell.classList.remove("fixed", "selected");

        if (puzzle[row][col] !== 0) {
            cell.classList.add("fixed"); // mark given numbers
        }

        // Click to select a cell
        cell.onclick = () => {
            if (!cell.classList.contains("fixed")) {
                if (selectedCell) selectedCell.classList.remove("selected");
                selectedCell = cell;
                selectedCell.classList.add("selected");
            }
        };
    }
}

// Place number in selected cell
function placeNumber(num) {
    if (!selectedCell) return;
    const id = parseInt(selectedCell.id);
    const row = Math.floor(id / 9);
    const col = id % 9;

    board[row][col] = num;
    selectedCell.textContent = num === 0 ? "" : num;
    saveGame();
}

// Backtracking solver
function isSafe(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num || board[x][col] === num) return false;
    }

    let startRow = row - (row % 3),
        startCol = col - (col % 3);

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r + startRow][c + startCol] === num) return false;
        }
    }
    return true;
}

function solve(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(board, row, col, num)) {
                        board[row][col] = num;
                        if (solve(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Fill solved board into UI
function renderSolution() {
    solve(board);
    for (let i = 0; i < 81; i++) {
        let row = Math.floor(i / 9);
        let col = i % 9;
        const cell = document.getElementById(i);
        cell.textContent = board[row][col];
    }
    saveGame();
}

// Event Listeners
document.getElementById("NewGame").addEventListener("click", getPuzzle);
document.getElementById("SolvePuzzle").addEventListener("click", renderSolution);

document.querySelectorAll(".num-key").forEach(btn => {
    btn.addEventListener("click", () => {
        placeNumber(parseInt(btn.textContent));
    });
});

document.getElementById("backspace").addEventListener("click", () => {
    placeNumber(0);
});

// Load saved game if available, otherwise fetch a new one
if (!loadGame()) {
    getPuzzle();
}
