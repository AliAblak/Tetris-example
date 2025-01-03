const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

context.scale(20, 20);

let score = 0;

// Tetris parçalarının renkleri
const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF'
];

// Tetris parçaları
const pieces = [
    [[1, 1, 1, 1]],                // I
    [[2, 2], [2, 2]],             // O
    [[0, 3, 0], [3, 3, 3]],       // T
    [[0, 4, 4], [4, 4, 0]],       // S
    [[5, 5, 0], [0, 5, 5]],       // Z
    [[6, 0, 0], [6, 6, 6]],       // J
    [[0, 0, 7], [7, 7, 7]]        // L
];

// Oyun alanı oluşturma
const arena = createMatrix(12, 20);

// Oyuncu parçası
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0
};

// Matrix oluşturma fonksiyonu
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// Çarpışma kontrolü
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Parça oluşturma
function createPiece(type) {
    return pieces[type];
}

// Oyun alanını çizme
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

// Matrix çizme
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x,
                               y + offset.y,
                               1, 1);
            }
        });
    });
}

// Matrisi birleştirme
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Oyuncuyu hareket ettirme
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// Oyuncuyu yatay hareket ettirme
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// Oyuncuyu sıfırlama
function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces.length * Math.random() | 0);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        score = 0;
        updateScore();
    }
}

// Oyuncuyu döndürme
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// Matris döndürme
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Tamamlanan satırları temizleme
function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;

    // Alttan üste doğru kontrol
    for (let y = arena.length - 1; y >= 0; y--) {
        let isRowFull = true;

        // Satırın tamamen dolu olup olmadığını kontrol et
        for (let x = 0; x < arena[y].length; x++) {
            if (arena[y][x] === 0) {
                isRowFull = false;
                break;
            }
        }

        // Eğer satır doluysa
        if (isRowFull) {
            // Dolu satırı kaldır
            const row = arena.splice(y, 1)[0];
            // Üste yeni boş satır ekle
            arena.unshift(new Array(row.length).fill(0));
            // y'yi bir artır çünkü bir satır silindi
            y++;
            
            linesCleared++;
            score += rowCount * 10;
            rowCount *= 2;
        }
    }

    // Boşlukları doldur
    fillGaps();
}

// Boşlukları doldurma fonksiyonu
function fillGaps() {
    // Alttan üste doğru her sütunu kontrol et
    for (let x = 0; x < arena[0].length; x++) {
        for (let y = arena.length - 1; y >= 0; y--) {
            // Eğer boş bir hücre bulunduysa
            if (arena[y][x] === 0) {
                // Üstteki ilk dolu hücreyi bul
                for (let ny = y - 1; ny >= 0; ny--) {
                    if (arena[ny][x] !== 0) {
                        // Dolu hücreyi aşağı taşı
                        arena[y][x] = arena[ny][x];
                        arena[ny][x] = 0;
                        break;
                    }
                }
            }
        }
    }
}

// Skor güncelleme
function updateScore() {
    scoreElement.innerText = score;
}

// Tuş kontrolleri
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {        // Sol ok
        playerMove(-1);
    } else if (event.keyCode === 39) { // Sağ ok
        playerMove(1);
    } else if (event.keyCode === 40) { // Aşağı ok
        playerDrop();
    } else if (event.keyCode === 38) { // Yukarı ok
        playerRotate(1);
    }
});

playerReset();
updateScore();
update();