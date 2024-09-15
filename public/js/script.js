const socket = io();

document.querySelectorAll('.checkbox').forEach((checkbox) => {
  checkbox.addEventListener('change', () => {
    const id = checkbox.getAttribute('data-id');
    const checked = checkbox.checked;

    socket.emit('checkbox-change', { id, checked });
  });
});

socket.on('checkbox-change', (data) => {
  const checkbox = document.querySelector(`#checkbox-${data.id}`);
  const totalChecks = document.querySelector('.total-checks-num');
  if (checkbox) {
    checkbox.checked = data.checked;

    if (totalChecks) {
       totalChecks.textContent = data.totalChecks;
    }
  }
});
