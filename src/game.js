class Game {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.ball = {
            x: 0,
            y: 0,
            dx: 10,
            dy: 10,
            dt: 0,
            radius: 10
        };
        this.paddle = {
            height: 150,
            width: 10
        }
        this.canvasHeight = 500;
        this.canvasWidth = 900;
        this.leftPaddleY = (this.canvasHeight - this.paddle.height) / 2;
        this.rightPaddleY = (this.canvasHeight - this.paddle.height) / 2;
        this.leftScore = 0;
        this.rightScore = 0;
        this.gameStarted = false;
    }

    setSocketIO(io) {
        this.io = io;
    }

    addPlayer(socket) {
        const player = {id: socket.id, side: null};

        if (this.players.length < 2) {
            if (this.players.length === 0) {
                console.log('Player 1 of room ' + this.roomId + ' joined!');
                player.side = 'left';
            } else {
                console.log('Player 2 of room ' + this.roomId + ' joined!');
                player.side = 'right';
            }
        }

        this.players.push(player);

        socket.join(this.roomId);
    }

    removePlayer(playerId) {
        const index = this.players.findIndex((player) => player.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }

        this.resetBall();
        this.resetGame();
    }

    isEmpty() {
        return this.players.length === 0;
    }

    isFull() {
        return this.players.length === 2;
    }

    getActivePlayers() {
        return this.players;
    }

    updateBall() {
        if (!this.gameStarted) {
            return;
        }

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Verificar colisão com as paredes verticais
        if (this.ball.y + this.ball.radius > this.canvasHeight || this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
        }

        // Verificar colisão com as raquetes
        if (
            this.ball.x - this.ball.radius < this.paddle.width && // Raquete esquerda
            this.ball.y + this.ball.radius > this.leftPaddleY &&
            this.ball.y - this.ball.radius < this.leftPaddleY + this.paddle.height
        ) {
            this.ball.dx *= -1;
        }

        if (
            this.ball.x + this.ball.radius > this.canvasWidth - this.paddle.width && // Raquete direita
            this.ball.y + this.ball.radius > this.rightPaddleY &&
            this.ball.y - this.ball.radius < this.rightPaddleY + this.paddle.height
        ) {
            this.ball.dx *= -1;
        }

        // Verificar se a bola passou das raquetes
        if (this.ball.x - this.ball.radius < 0) {
            // Bola passou da raquete esquerda
            this.resetBall();
            // Atualizar placar ou executar ação adequada
            this.rightScore++;
            this.resetBall();
            this.io.to(this.roomId).emit('scoreUpdate', {left: this.leftScore, right: this.rightScore});
        } else if (this.ball.x + this.ball.radius > this.canvasWidth) {
            // Bola passou da raquete direita
            this.leftScore++;
            this.resetBall();
            this.io.to(this.roomId).emit('scoreUpdate', {left: this.leftScore, right: this.rightScore});
            // Atualizar placar ou executar ação adequada
        }
    }

    resetBall() {
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.canvasHeight / 2;
        this.ball.dx = 0;
        this.ball.dy = 0;

        // Aguardar 1 segundo antes de reiniciar o jogo
        setTimeout(() => {
            // Definir velocidade aleatória
            this.ball.dx = Math.random() < 0.5 ? -10 : 10;
            this.ball.dy = Math.random() < 0.5 ? -10 : 10;
        }, 1000);
    }

    resetGame() {
        this.ball = {
            x: 0,
            y: 0,
            dx: 5,
            dy: 5,
            radius: 10
        };
        this.leftScore = 0;
        this.rightScore = 0;
        this.gameStarted = false;
        this.io.to(this.roomId).emit('resetGame');
    }

    initGame() {
        setInterval(() => {
            if (this.gameStarted) {
                this.updateBall();
                this.io.to(this.roomId).emit('ballData', this.ball);
            }
        }, 33.33); // 30 quadros por segundo (1000ms / 30 = 33.33)
    }
}

module.exports = Game;
