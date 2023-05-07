class Game {
    constructor() {
        this.players = [];
        this.ball = {
            x: 0,
            y: 0,
            dx: 5,
            dy: 5,
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
    }

    setSocketIO(io) {
        this.io = io;
    }

    addPlayer(socket) {
        const player = {id: socket.id, side: 'spectator'};

        if (this.players.length < 2) {
            if (this.players.length === 0) {
                player.side = 'left';
            } else {
                player.side = 'right';
            }
        }

        this.players.push(player);

        // if (this.players.length === 2) {
        this.io.emit('startGame');
        // }
    }

    removePlayer(playerId) {
        const index = this.players.findIndex((player) => player.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
        }
        this.ball = {
            x: 0,
            y: 0,
            dx: 5,
            dy: 5
        };
    }

    getActivePlayers() {
        return this.players.filter((player) => player.side !== 'spectator');
    }

    updateBall() {
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
        } else if (this.ball.x + this.ball.radius > this.canvasWidth) {
            // Bola passou da raquete direita
            this.resetBall();
            // Atualizar placar ou executar ação adequada
        }
    }

    resetBall() {
        this.ball.x = this.canvasWidth / 2;
        this.ball.y = this.canvasHeight / 2;
        this.ball.dx *= Math.random() < 0.5 ? -1 : 1;
        this.ball.dy *= Math.random() < 0.5 ? -1 : 1;
    }
}

module.exports = Game;
