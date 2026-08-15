/* =========================================================
   MINESWEEPER 💣
   Classic Minesweeper
========================================================= */


/* =========================================================
   DOM
========================================================= */

const gameBoard = document.getElementById("gameBoard");
const mineCountDisplay = document.getElementById("mineCount");
const timerDisplay = document.getElementById("timer");
const restartButton = document.getElementById("restartButton");
const gameMessage = document.getElementById("gameMessage");
const musicButton = document.getElementById("musicButton");

const difficultyButtons =
    document.querySelectorAll(".difficulty-button");

const flagCountDisplay =
    document.getElementById("flagCount");


/* =========================================================
   DIFFICULTIES
========================================================= */

const difficulties = {

    beginner: {
        rows: 9,
        cols: 9,
        mines: 10
    },

    intermediate: {
        rows: 16,
        cols: 16,
        mines: 40
    },

    expert: {
        rows: 16,
        cols: 16,
        mines: 99
    }

};


/* =========================================================
   GAME STATE
========================================================= */

let currentDifficulty = "beginner";

let rows = 9;
let cols = 9;
let totalMines = 10;

let board = [];

let gameStarted = false;
let gameOver = false;
let gameWon = false;

let flagsUsed = 0;

let elapsedTime = 0;

let timerInterval = null;

let firstClick = true;


/* =========================================================
   MUSIC
========================================================= */

const backgroundMusic =
    new Audio("music.mp3");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.35;

let musicEnabled = true;


/* =========================================================
   RANDOM NUMBER
========================================================= */

function randomInt(max) {

    return Math.floor(
        Math.random() * max
    );

}


/* =========================================================
   CREATE EMPTY BOARD
========================================================= */

function createEmptyBoard() {

    board = [];

    for (let row = 0; row < rows; row++) {

        const rowData = [];

        for (let col = 0; col < cols; col++) {

            rowData.push({

                row: row,
                col: col,

                mine: false,

                revealed: false,

                flagged: false,

                number: 0

            });

        }

        board.push(rowData);

    }

}


/* =========================================================
   GET NEIGHBOURS
========================================================= */

function getNeighbours(row, col) {

    const neighbours = [];

    for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
    ) {

        for (
            let colOffset = -1;
            colOffset <= 1;
            colOffset++
        ) {

            if (
                rowOffset === 0 &&
                colOffset === 0
            ) {
                continue;
            }


            const newRow =
                row + rowOffset;

            const newCol =
                col + colOffset;


            if (
                newRow >= 0 &&
                newRow < rows &&
                newCol >= 0 &&
                newCol < cols
            ) {

                neighbours.push(
                    board[newRow][newCol]
                );

            }

        }

    }

    return neighbours;

}


/* =========================================================
   PLACE MINES
========================================================= */

function placeMines(safeRow, safeCol) {

    let minesPlaced = 0;

    /*
        First click and its surrounding cells
        are protected.
    */

    const safeCells = new Set();

    safeCells.add(
        `${safeRow},${safeCol}`
    );


    getNeighbours(
        safeRow,
        safeCol
    ).forEach(cell => {

        safeCells.add(
            `${cell.row},${cell.col}`
        );

    });


    while (
        minesPlaced < totalMines
    ) {

        const row =
            randomInt(rows);

        const col =
            randomInt(cols);

        const key =
            `${row},${col}`;


        if (
            safeCells.has(key)
        ) {
            continue;
        }


        const cell =
            board[row][col];


        if (
            cell.mine
        ) {
            continue;
        }


        cell.mine = true;

        minesPlaced++;

    }


    calculateNumbers();

}


/* =========================================================
   CALCULATE NUMBERS
========================================================= */

function calculateNumbers() {

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const cell =
                board[row][col];


            if (cell.mine) {

                cell.number = 0;

                continue;

            }


            const neighbours =
                getNeighbours(
                    row,
                    col
                );


            cell.number =
                neighbours.filter(
                    neighbour =>
                        neighbour.mine
                ).length;

        }

    }

}


/* =========================================================
   CREATE BOARD UI
========================================================= */

function renderBoard() {

    gameBoard.innerHTML = "";

    gameBoard.style.gridTemplateColumns =
        `repeat(${cols}, 1fr)`;

    gameBoard.style.gridTemplateRows =
        `repeat(${rows}, 1fr)`;


    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const cell =
                board[row][col];


            const element =
                document.createElement("button");


            element.className =
                "mine-cell";


            element.dataset.row =
                row;

            element.dataset.col =
                col;


            /*
                Left click
            */

            element.addEventListener(
                "click",
                () => {

                    revealCell(
                        row,
                        col
                    );

                }
            );


            /*
                Desktop right click
            */

            element.addEventListener(
                "contextmenu",
                event => {

                    event.preventDefault();

                    toggleFlag(
                        row,
                        col
                    );

                }
            );


            /*
                Mobile long press
            */

            setupLongPress(
                element,
                row,
                col
            );


            gameBoard.appendChild(
                element
            );

        }

    }


    updateBoard();

}


/* =========================================================
   UPDATE BOARD UI
========================================================= */

function updateBoard() {

    const elements =
        gameBoard.querySelectorAll(
            ".mine-cell"
        );


    elements.forEach(
        element => {

            const row =
                Number(
                    element.dataset.row
                );

            const col =
                Number(
                    element.dataset.col
                );


            const cell =
                board[row][col];


            element.className =
                "mine-cell";


            element.textContent =
                "";


            if (cell.flagged) {

                element.classList.add(
                    "flagged"
                );

                element.textContent =
                    "🚩";

                return;

            }


            if (!cell.revealed) {

                return;

            }


            element.classList.add(
                "revealed"
            );


            if (cell.mine) {

                element.classList.add(
                    "mine"
                );

                element.textContent =
                    "💣";

                return;

            }


            if (cell.number > 0) {

                element.classList.add(
                    `number-${cell.number}`
                );

                element.textContent =
                    cell.number;

            }

        }
    );

}


/* =========================================================
   REVEAL CELL
========================================================= */

function revealCell(row, col) {

    if (gameOver || gameWon) {
        return;
    }


    const cell =
        board[row][col];


    if (cell.flagged) {
        return;
    }


    if (cell.revealed) {

        /*
            Classic Minesweeper behaviour:
            clicking a revealed number can
            reveal surrounding cells when
            enough flags are present.
        */

        chordReveal(
            row,
            col
        );

        return;

    }


    /*
        FIRST CLICK
    */

    if (firstClick) {

        firstClick = false;

        gameStarted = true;

        startTimer();

        placeMines(
            row,
            col
        );

        /*
            Start music after user interaction.
        */

        startMusic();

    }


    /*
        Mine!
    */

    if (cell.mine) {

        cell.revealed = true;

        loseGame(
            row,
            col
        );

        return;

    }


    /*
        Normal reveal.
    */

    revealArea(
        row,
        col
    );


    updateBoard();

    checkWin();

}


/* =========================================================
   REVEAL EMPTY AREA
========================================================= */

function revealArea(startRow, startCol) {

    const queue = [];

    queue.push([
        startRow,
        startCol
    ]);


    const visited =
        new Set();


    while (queue.length > 0) {

        const [
            row,
            col
        ] = queue.shift();


        const key =
            `${row},${col}`;


        if (
            visited.has(key)
        ) {
            continue;
        }


        visited.add(key);


        const cell =
            board[row][col];


        if (
            cell.flagged ||
            cell.mine ||
            cell.revealed
        ) {
            continue;
        }


        cell.revealed = true;


        /*
            If the cell has no mines nearby,
            automatically reveal neighbours.
        */

        if (
            cell.number === 0
        ) {

            getNeighbours(
                row,
                col
            ).forEach(
                neighbour => {

                    if (
                        !neighbour.mine &&
                        !neighbour.flagged &&
                        !neighbour.revealed
                    ) {

                        queue.push([
                            neighbour.row,
                            neighbour.col
                        ]);

                    }

                }
            );

        }

    }

}


/* =========================================================
   FLAG
========================================================= */

function toggleFlag(row, col) {

    if (gameOver || gameWon) {
        return;
    }


    const cell =
        board[row][col];


    if (cell.revealed) {
        return;
    }


    if (!cell.flagged) {

        if (
            flagsUsed >= totalMines
        ) {

            return;

        }


        cell.flagged = true;

        flagsUsed++;

    } else {

        cell.flagged = false;

        flagsUsed--;

    }


    updateMineCounter();

    updateBoard();

    checkWin();

   updateFlagCounter();

}


/* =========================================================
   MINE COUNTER
========================================================= */

function updateMineCounter() {

    const remaining =
        totalMines -
        flagsUsed;


    if (mineCountDisplay) {

        mineCountDisplay.textContent =
            String(
                remaining
            ).padStart(
                2,
                "0"
            );

    }

}


/* =========================================================
   CHORD REVEAL
========================================================= */

function chordReveal(row, col) {

    const cell =
        board[row][col];


    if (
        !cell.revealed ||
        cell.number === 0
    ) {
        return;
    }


    const neighbours =
        getNeighbours(
            row,
            col
        );


    const flaggedCount =
        neighbours.filter(
            neighbour =>
                neighbour.flagged
        ).length;


    /*
        Only open surrounding cells when
        the number of flags matches the number.
    */

    if (
        flaggedCount !== cell.number
    ) {
        return;
    }


    for (
        const neighbour of neighbours
    ) {

        if (
            neighbour.revealed ||
            neighbour.flagged
        ) {
            continue;
        }


        if (
            neighbour.mine
        ) {

            neighbour.revealed =
                true;

            loseGame(
                neighbour.row,
                neighbour.col
            );

            return;

        }


        revealArea(
            neighbour.row,
            neighbour.col
        );

    }


    updateBoard();

    checkWin();

}


/* =========================================================
   LOSE GAME
========================================================= */

function loseGame(
    explodedRow,
    explodedCol
) {

    gameOver = true;

    stopTimer();


    /*
        Reveal all mines.
    */

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const cell =
                board[row][col];


            if (cell.mine) {

                cell.revealed = true;

            }

        }

    }


    updateBoard();


    /*
        Highlight the mine that was clicked.
    */

    const exploded =
        gameBoard.querySelector(
            `[data-row="${explodedRow}"][data-col="${explodedCol}"]`
        );


    if (exploded) {

        exploded.classList.add(
            "exploded"
        );

    }


    if (restartButton) {

        restartButton.textContent =
            "😵";

    }


    if (gameMessage) {

        gameMessage.textContent =
            "BOOM! You hit a mine 💥";

    }

}


/* =========================================================
   CHECK WIN
========================================================= */

function checkWin() {

    if (
        gameOver ||
        gameWon
    ) {
        return;
    }


    let safeCells =
        0;


    let revealedSafeCells =
        0;


    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const cell =
                board[row][col];


            if (!cell.mine) {

                safeCells++;


                if (
                    cell.revealed
                ) {

                    revealedSafeCells++;

                }

            }

        }

    }


    if (
        revealedSafeCells ===
        safeCells
    ) {

        winGame();

    }

}


/* =========================================================
   WIN GAME
========================================================= */

function winGame() {

    gameWon = true;

    stopTimer();


    /*
        Automatically flag remaining mines.
    */

    for (let row = 0; row < rows; row++) {

        for (let col = 0; col < cols; col++) {

            const cell =
                board[row][col];


            if (
                cell.mine &&
                !cell.flagged
            ) {

                cell.flagged = true;

                flagsUsed++;

            }

        }

    }


    updateMineCounter();

    updateBoard();


    gameBoard.classList.add(
        "won"
    );


    if (restartButton) {

        restartButton.textContent =
            "😎";

    }


    if (gameMessage) {

        gameMessage.textContent =
            `You cleared the board! 🎉 ${elapsedTime}s`;

    }

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();


    timerInterval =
        setInterval(
            () => {

                if (
                    elapsedTime >= 999
                ) {

                    elapsedTime = 999;

                    updateTimer();

                    return;

                }


                elapsedTime++;

                updateTimer();

            },
            1000
        );

}


function stopTimer() {

    if (
        timerInterval
    ) {

        clearInterval(
            timerInterval
        );

        timerInterval =
            null;

    }

}


function updateTimer() {

    if (timerDisplay) {

        timerDisplay.textContent =
            String(
                elapsedTime
            ).padStart(
                3,
                "0"
            );

    }

}


/* =========================================================
   MOBILE LONG PRESS
========================================================= */

function setupLongPress(
    element,
    row,
    col
) {

    let pressTimer = null;

    let longPressTriggered =
        false;


    element.addEventListener(
        "pointerdown",
        event => {

            /*
                Only use long press for
                touch / pen.

                Desktop mouse continues to
                use right-click.
            */

            if (
                event.pointerType ===
                "mouse"
            ) {
                return;
            }


            longPressTriggered =
                false;


            pressTimer =
                setTimeout(
                    () => {

                        longPressTriggered =
                            true;


                        toggleFlag(
                            row,
                            col
                        );


                        /*
                            Small vibration
                            if supported.
                        */

                        if (
                            navigator.vibrate
                        ) {

                            navigator.vibrate(
                                40
                            );

                        }

                    },
                    450
                );

        }
    );


    element.addEventListener(
        "pointerup",
        () => {

            clearTimeout(
                pressTimer
            );

        }
    );


    element.addEventListener(
        "pointercancel",
        () => {

            clearTimeout(
                pressTimer
            );

        }
    );


    element.addEventListener(
        "pointerleave",
        () => {

            clearTimeout(
                pressTimer
            );

        }
    );


    /*
        Prevent the browser's context menu
        from appearing after long press.
    */

    element.addEventListener(
        "contextmenu",
        event => {

            if (
                event.pointerType !==
                "mouse"
            ) {

                event.preventDefault();

            }

        }
    );

}


/* =========================================================
   RESET GAME
========================================================= */

function newGame() {

    stopTimer();


    rows =
        difficulties[
            currentDifficulty
        ].rows;


    cols =
        difficulties[
            currentDifficulty
        ].cols;


    totalMines =
        difficulties[
            currentDifficulty
        ].mines;


    flagsUsed =
        0;


    elapsedTime =
        0;


    gameStarted =
        false;


    gameOver =
        false;


    gameWon =
        false;


    firstClick =
        true;


    gameBoard.classList.remove(
        "won"
    );


    if (restartButton) {

        restartButton.textContent =
            "🙂";

    }


    if (gameMessage) {

        gameMessage.textContent =
            "Click a square to begin! 💣";

    }


    updateTimer();

    updateMineCounter();


    createEmptyBoard();

    renderBoard();

}


/* =========================================================
   RESTART BUTTON
========================================================= */

restartButton.addEventListener(
    "click",
    () => {

        newGame();

    }
);


/* =========================================================
   DIFFICULTY BUTTONS
========================================================= */

difficultyButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const difficulty =
                    button.dataset.difficulty;


                if (
                    !difficulties[
                        difficulty
                    ]
                ) {
                    return;
                }


                currentDifficulty =
                    difficulty;


                difficultyButtons.forEach(
                    otherButton => {

                        otherButton.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                newGame();

            }
        );

    }
);


/* =========================================================
   MUSIC
========================================================= */

function startMusic() {

    if (
        !musicEnabled
    ) {
        return;
    }


    backgroundMusic
        .play()
        .catch(
            () => {}
        );

}


if (musicButton) {

    musicButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            musicEnabled =
                !musicEnabled;


            if (
                musicEnabled
            ) {

                startMusic();


                musicButton.textContent =
                    "🎵 Music On";

            } else {

                backgroundMusic.pause();


                musicButton.textContent =
                    "🔇 Music Off";

            }

        }
    );

}


/* =========================================================
   START MUSIC AFTER FIRST USER ACTION
========================================================= */

document.addEventListener(
    "click",
    () => {

        if (
            musicEnabled &&
            backgroundMusic.paused
        ) {

            startMusic();

        }

    },
    {
        once: true
    }
);

/* =========================================================
   FLAG
========================================================= */


function updateFlagCounter() {

    if (flagCountDisplay) {

        flagCountDisplay.textContent =
            flagsUsed;

    }

}


/* =========================================================
   START GAME
========================================================= */

newGame();

updateFlagCounter();
