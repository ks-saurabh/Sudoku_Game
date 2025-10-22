const board = Array.from({ length: 9 }, () => Array(9).fill(0));
const solboard = Array.from({ length: 9 }, () => Array(9).fill(0));
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
        solboard[row][col] = puzzle[row][col];

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

function checkUserSolution() {
    // Check if all cells are filled
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (board[i][j] === 0) return;
        }
    }

    // Solve the stored initial board (copy)
    solve(solboard);

    // Compare each element
    let isCorrect = true;
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const id = i * 9 + j;
            const cell = document.getElementById(id);

            if (board[i][j] !== solboard[i][j]) {
                isCorrect = false;
                cell.classList.add("wrong");
            } else {
                cell.classList.remove("wrong");
            }
        }
    }

    if (isCorrect) {
        document.querySelectorAll(".sudoku_grid div").forEach((cell) => {
            cell.classList.add("correct");
        });
        setTimeout(() => {
            alert("🎉 Congratulations! You solved the Sudoku correctly!");
            document.querySelectorAll(".sudoku_grid div").forEach((cell) => {
                cell.classList.remove("correct");
            });
        }, 300);
    } else {
        setTimeout(() => {
            alert("❌ Some numbers are incorrect. Try again!");
            document.querySelectorAll(".wrong").forEach((cell) => {
                cell.classList.remove("wrong");
            });
        }, 300);
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
    checkUserSolution();
}

// Backtracking solver
function isSafe(solboard, row, col, num) {
    for (let x = 0; x < 9; x++) {
        if (solboard[row][x] === num || solboard[x][col] === num) return false;
    }

    let startRow = row - (row % 3),
        startCol = col - (col % 3);

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (solboard[r + startRow][c + startCol] === num) return false;
        }
    }
    return true;
}

function solve(solboard) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (solboard[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isSafe(solboard, row, col, num)) {
                        solboard[row][col] = num;
                        if (solve(solboard)) return true;
                        solboard[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// Fill solved solboard into UI
function renderSolution() {
    solve(solboard);
    for (let i = 0; i < 81; i++) {
        let row = Math.floor(i / 9);
        let col = i % 9;
        const cell = document.getElementById(i);
        cell.textContent = solboard[row][col];
    }
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
