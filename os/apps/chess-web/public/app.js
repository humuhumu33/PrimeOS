async function fetchBoard() {
  const res = await fetch('/api/board');
  const data = await res.json();
  renderBoard(data.board);
}

function renderBoard(fen) {
  const boardDiv = document.getElementById('board');
  const table = document.createElement('table');
  const rows = fen.split(' ')[0].split('/');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    for (const ch of row) {
      if (isNaN(parseInt(ch))) {
        const td = document.createElement('td');
        td.textContent = ch;
        tr.appendChild(td);
      } else {
        for (let i = 0; i < parseInt(ch); i++) {
          const td = document.createElement('td');
          tr.appendChild(td);
        }
      }
    }
    table.appendChild(tr);
  });
  boardDiv.innerHTML = '';
  boardDiv.appendChild(table);
}

document.getElementById('moveForm').addEventListener('submit', async e => {
  e.preventDefault();
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const promotion = document.getElementById('promotion').value;
  const res = await fetch('/api/player-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, promotion: promotion || undefined })
  });
  const data = await res.json();
  if (data.board) renderBoard(data.board);
  const status = document.getElementById('status');
  if (data.gameOver) {
    status.textContent = data.mate ? 'Checkmate!' : 'Stalemate!';
  } else {
    status.textContent = data.engineMove ?
      `Engine move: ${data.engineMove.from}${data.engineMove.to}${data.engineMove.promotion || ''}${data.check ? ' check' : ''}`
      : '';
  }
});

fetchBoard();
