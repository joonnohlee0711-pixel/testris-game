// 게임 상수
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const LINES_PER_LEVEL = 10;

// 테트로미노 모양 정의
const SHAPES = {
    I: [[1, 1, 1, 1]],
    O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000'
};

// 게임 상태
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.dropInterval = 1000; // 1초
        this.lastTime = 0;
        
        this.setupControls();
        this.updateDisplay();
        this.showOverlay('게임 시작', '시작 버튼을 클릭하세요');
        this.draw(); // 초기 화면 그리기
    }
    
    createBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }
    
    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted || this.gameOver) return;
            if (this.paused && e.key !== 'p' && e.key !== 'P') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1);
                    break;
                case 'ArrowDown':
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
                case 'p':
                case 'P':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });
        
        document.getElementById('startButton').addEventListener('click', () => {
            this.start();
        });
    }
    
    start() {
        this.board = this.createBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.paused = false;
        this.gameStarted = true;
        this.dropInterval = 1000;
        
        this.nextPiece = this.createPiece();
        this.spawnPiece();
        this.hideOverlay();
        this.updateDisplay();
        this.gameLoop();
    }
    
    createPiece() {
        const shapes = Object.keys(SHAPES);
        const type = shapes[Math.floor(Math.random() * shapes.length)];
        return {
            shape: SHAPES[type],
            color: COLORS[type],
            x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
            y: 0,
            type: type
        };
    }
    
    spawnPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        this.drawNextPiece();
        
        if (this.collision()) {
            this.endGame();
        }
    }
    
    movePiece(dir) {
        this.currentPiece.x += dir;
        if (this.collision()) {
            this.currentPiece.x -= dir;
        }
    }
    
    dropPiece() {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.lockPiece();
            this.clearLines();
            this.spawnPiece();
        }
        this.dropCounter = 0;
    }
    
    hardDrop() {
        // 블록을 끝까지 내리기
        let dropDistance = 0;
        while (!this.collision()) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.currentPiece.y--;
        
        // hard drop 보너스 점수
        this.score += dropDistance * 2;
        this.updateDisplay();
        
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
        this.dropCounter = 0;
    }
    
    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        
        const previousShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.collision()) {
            this.currentPiece.shape = previousShape;
        }
    }
    
    collision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const newX = this.currentPiece.x + x;
                    const newY = this.currentPiece.y + y;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    const boardX = this.currentPiece.x + x;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesToClear = [];
        
        // 클리어할 라인 찾기
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }
        
        if (linesToClear.length > 0) {
            // 원본 라인 색상 저장
            const savedLines = linesToClear.map(y => [...this.board[y]]);
            
            // 애니메이션 효과
            this.animateLineClear(linesToClear, savedLines, () => {
                // 애니메이션 완료 후 라인 제거
                linesToClear.sort((a, b) => a - b);
                for (let i = linesToClear.length - 1; i >= 0; i--) {
                    this.board.splice(linesToClear[i], 1);
                    this.board.unshift(Array(COLS).fill(0));
                }
            });
            
            this.lines += linesToClear.length;
            // 점수 계산: 레벨에 따라 점수 배율 증가
            const baseScore = [0, 100, 300, 500, 800];
            this.score += baseScore[linesToClear.length] * this.level;
            
            // 레벨 업 체크
            const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.updateDropSpeed();
            }
            
            this.updateDisplay();
        }
    }
    
    animateLineClear(lines, savedLines, callback) {
        let flashCount = 0;
        const maxFlash = 4;
        
        const flash = () => {
            if (flashCount >= maxFlash) {
                // 애니메이션 완료 후 원본 복원하고 라인 제거
                lines.forEach((y, idx) => {
                    this.board[y] = savedLines[idx];
                });
                callback();
                this.draw();
                return;
            }
            
            // 깜빡임 효과
            lines.forEach(y => {
                for (let x = 0; x < COLS; x++) {
                    this.board[y][x] = flashCount % 2 === 0 ? '#ffffff' : '#ffff00';
                }
            });
            
            this.draw();
            flashCount++;
            setTimeout(flash, 80);
        };
        
        flash();
    }
    
    updateDropSpeed() {
        // 레벨이 높아질수록 낙하 속도 증가
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.showOverlay('일시정지', 'P를 눌러 계속하세요');
        } else {
            this.hideOverlay();
        }
    }
    
    gameLoop(time = 0) {
        if (this.gameOver) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        if (!this.paused) {
            this.dropCounter += deltaTime;
            if (this.dropCounter > this.dropInterval) {
                this.dropPiece();
            }
            
            this.draw();
        }
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    draw() {
        // 배경 지우기
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 보드 그리기
        this.drawBoard();
        
        // 현재 피스 그리기
        if (this.currentPiece) {
            this.drawPiece(this.currentPiece, this.ctx);
        }
        
        // 그리드 그리기
        this.drawGrid();
    }
    
    drawBoard() {
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.board[y][x];
                    this.ctx.fillRect(
                        x * BLOCK_SIZE,
                        y * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    drawPiece(piece, context, offsetX = 0, offsetY = 0) {
        context.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    context.fillRect(
                        (piece.x + x + offsetX) * BLOCK_SIZE,
                        (piece.y + y + offsetY) * BLOCK_SIZE,
                        BLOCK_SIZE - 1,
                        BLOCK_SIZE - 1
                    );
                }
            }
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= COLS; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * BLOCK_SIZE, 0);
            this.ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= ROWS; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
            this.ctx.stroke();
        }
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = '#fff';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const piece = this.nextPiece;
        const size = 25;
        const offsetX = (this.nextCanvas.width - piece.shape[0].length * size) / 2;
        const offsetY = (this.nextCanvas.height - piece.shape.length * size) / 2;
        
        this.nextCtx.fillStyle = piece.color;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.nextCtx.fillRect(
                        offsetX + x * size,
                        offsetY + y * size,
                        size - 1,
                        size - 1
                    );
                }
            }
        }
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    showOverlay(title, message) {
        const overlay = document.getElementById('gameOverlay');
        document.getElementById('overlayTitle').textContent = title;
        document.getElementById('overlayMessage').textContent = message;
        overlay.classList.remove('hidden');
    }
    
    hideOverlay() {
        document.getElementById('gameOverlay').classList.add('hidden');
    }
    
    endGame() {
        this.gameOver = true;
        this.gameStarted = false;
        this.showScoreModal();
    }
    
    showScoreModal() {
        const modal = document.getElementById('scoreModal');
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalLevel').textContent = this.level;
        document.getElementById('finalLines').textContent = this.lines;
        modal.classList.remove('hidden');
        document.getElementById('playerName').focus();
    }
    
    hideScoreModal() {
        document.getElementById('scoreModal').classList.add('hidden');
        document.getElementById('playerName').value = '';
        this.showOverlay('게임 오버', '스페이스를 눌러 다시 시작하세요');
    }
}

// 게임 초기화
let game;

window.addEventListener('load', () => {
    game = new Game();
    
    // 점수 저장 버튼
    document.getElementById('submitScore').addEventListener('click', async () => {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            alert('이름을 입력해주세요!');
            return;
        }
        
        await saveScore(playerName, game.score, game.level, game.lines);
        game.hideScoreModal();
        loadLeaderboard();
    });
    
    // 건너뛰기 버튼
    document.getElementById('skipScore').addEventListener('click', () => {
        game.hideScoreModal();
    });
    
    // 리더보드 새로고침
    document.getElementById('refreshLeaderboard').addEventListener('click', () => {
        loadLeaderboard();
    });
    
    // 초기 리더보드 로드
    loadLeaderboard();
});
