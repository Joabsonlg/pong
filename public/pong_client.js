let side = 'spectator';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const socket = io('http://localhost:3000');

let paddleHeight = 150;
let paddleWidth = 10;

let leftPaddleY = (canvas.height - paddleHeight) / 2;
let rightPaddleY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;

socket.on('playersData', (playersData) => {
    const player = playersData.find((player) => player.id === socket.id);
    if (player) {
        side = player.side;
    }
});

socket.on('updatePaddle', (data) => {
    if (data.player === 'left') {
        leftPaddleY = data.y;
    } else {
        rightPaddleY = data.y;
    }
});

socket.on('ballData', (data) => {
    ballX = data.x;
    ballY = data.y;
});

socket.on('paddleData', (data) => {
    paddleWidth = data.width;
    paddleHeight = data.height;
    leftPaddleY = (canvas.height - paddleHeight) / 2;
    rightPaddleY = (canvas.height - paddleHeight) / 2;
});

socket.on('startGame', () => {
    startGame();
});

canvas.addEventListener('mousemove', (event) => {
    if (side !== 'spectator') {
        const mouseY = event.clientY - canvas.getBoundingClientRect().top;

        if (side === 'left') leftPaddleY = mouseY - paddleHeight / 2;
        else rightPaddleY = mouseY - paddleHeight / 2;

        socket.emit('updatePaddle', {player: side, y: mouseY - paddleHeight / 2});
    }
});

function drawBall() {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar paddles
    ctx.fillStyle = 'black';
    ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

    drawBall();

    requestAnimationFrame(draw);
}

const startGame = () => {
    draw();
}

