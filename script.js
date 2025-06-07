class Tetris {
    constructor() {
        this.board = document.getElementById('gameBoard');
        this.nextPiece = document.getElementById('nextPiece');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.linesElement = document.getElementById('lines');
        this.startButton = document.getElementById('startButton');

        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.currentPiece = null;
        this.nextPieceData = null;
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameOver = false;
        this.gameLoop = null;
        this.dropInterval = 1000;

        this.shapes = [
            [[1, 1, 1, 1]], // I
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]], // J
            [[1, 1], [1, 1]], // O
            [[1, 1, 0], [0, 1, 1]], // S
            [[0, 1, 1], [1, 1, 0]]  // Z
        ];

        this.colors = [
            '#00ffff', '#ff00ff', '#ff8c00', '#00ff00',
            '#ffff00', '#00ffff', '#ff00ff'
        ];

        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startGame() {
        if (this.gameLoop) return;
        
        this.resetGame();
        this.gameLoop = setInterval(() => this.gameTick(), this.dropInterval);
        this.startButton.textContent = 'ゲームをリセット';
    }

    resetGame() {
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.level = 1;
        this.linesCleared = 0;
        this.gameOver = false;
        this.updateUI();
        this.newPiece();
    }

    newPiece() {
        this.currentPiece = this.nextPieceData || this.getRandomPiece();
        this.nextPieceData = this.getRandomPiece();
        this.drawNextPiece();
        
        if (!this.isValidPosition()) {
            this.gameOver = true;
            clearInterval(this.gameLoop);
            alert('ゲームオーバー！');
            return;
        }
        
        this.drawPiece();
    }

    getRandomPiece() {
        const shape = this.shapes[Math.floor(Math.random() * this.shapes.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        return { shape, color, x: 3, y: 0 };
    }

    drawPiece() {
        this.clearBoard();
        
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.drawCell(
                        this.currentPiece.x + x,
                        this.currentPiece.y + y,
                        this.currentPiece.color
                    );
                }
            });
        });
    }

    drawNextPiece() {
        this.nextPiece.innerHTML = '';
        
        // 次のブロックの表示位置を調整
        const offsetX = 15; // 左右の中央に寄せるためのオフセット
        const offsetY = 60; // 上下の中央に寄せるためのオフセット
        
        this.nextPieceData.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const cell = document.createElement('div');
                    cell.style.width = '10px';
                    cell.style.height = '10px';
                    cell.style.backgroundColor = this.nextPieceData.color;
                    cell.style.position = 'absolute';
                    cell.style.left = (x * 10 + offsetX) + 'px';
                    cell.style.top = (y * 10 + offsetY) + 'px';
                    this.nextPiece.appendChild(cell);
                }
            });
        });
    }

    clearBoard() {
        // 固定されたブロックのみを残す
        const fixedCells = Array.from(this.board.getElementsByClassName('fixed-cell'));
        this.board.innerHTML = '';
        fixedCells.forEach(cell => this.board.appendChild(cell));
    }

    drawCell(x, y, color, isFixed = false) {
        const cell = document.createElement('div');
        cell.className = isFixed ? 'fixed-cell' : 'cell';
        cell.style.left = x * 20 + 'px';
        cell.style.top = y * 20 + 'px';
        cell.style.backgroundColor = color;
        this.board.appendChild(cell);
    }

    isValidPosition(piece = this.currentPiece) {
        const { shape, x, y } = piece;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    if (
                        x + col < 0 ||
                        x + col >= 10 ||
                        y + row >= 20 ||
                        (y + row >= 0 && this.grid[y + row][x + col])
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    handleKeyPress(e) {
        if (this.gameOver) return;

        switch (e.key) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                this.rotatePiece();
                break;
            case ' ':
                this.hardDrop();
                break;
        }
    }

    movePiece(dx, dy) {
        const temp = { ...this.currentPiece };
        temp.x += dx;
        temp.y += dy;

        if (this.isValidPosition(temp)) {
            this.currentPiece.x = temp.x;
            this.currentPiece.y = temp.y;
            this.drawPiece();
        }
    }

    rotatePiece() {
        const temp = { ...this.currentPiece };
        const shape = temp.shape;
        
        // 90度回転
        const newShape = shape[0].map((_, i) =>
            shape.map(row => row[i]).reverse()
        );
        
        temp.shape = newShape;
        
        if (this.isValidPosition(temp)) {
            this.currentPiece.shape = newShape;
            this.drawPiece();
        }
    }

    hardDrop() {
        while (this.isValidPosition()) {
            this.currentPiece.y++;
        }
        this.currentPiece.y--;
        this.drawPiece();
        this.lockPiece();
    }

    gameTick() {
        // ブロックを1マス下に移動
        this.currentPiece.y++;
        
        // ブロックが固定できない場合
        if (!this.isValidPosition()) {
            // 1マス戻す
            this.currentPiece.y--;
            this.lockPiece();
            return;
        }
        
        this.drawPiece();
    }

    lockPiece() {
        const { shape, x, y, color } = this.currentPiece;
        
        // ブロックを固定
        shape.forEach((row, i) => {
            row.forEach((value, j) => {
                if (value) {
                    this.grid[y + i][x + j] = color;
                }
            });
        });

        // ラインの消去
        this.clearLines();

        // 固定されたブロックを再描画
        this.board.innerHTML = '';
        this.grid.forEach((row, y) => {
            row.forEach((color, x) => {
                if (color) {
                    this.drawCell(x, y, color, true);
                }
            });
        });

        // 新しいブロックを生成
        this.newPiece();
    }

    clearLines() {
        let linesCleared = 0;
        
        // 消去するラインを特定
        for (let i = 0; i < 20; i++) {
            if (this.grid[i].every(cell => cell)) {
                // グリッドを更新
                this.grid.splice(i, 1);
                this.grid.unshift(Array(10).fill(0));
                linesCleared++;
            }
        }

        if (linesCleared > 0) {
            this.score += linesCleared * 100;
            this.linesCleared += linesCleared;
            this.level = Math.floor(this.linesCleared / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.gameTick(), this.dropInterval);
            }
            
            this.updateUI();
        }
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.linesElement.textContent = this.linesCleared;
    }
}

// ゲームの開始
const game = new Tetris();
