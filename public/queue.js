async function loadQueue() {
  const res = await fetch('/api/admin/queue');
  const container = document.getElementById('queue-list');
  
  if (!res.ok) {
    const data = await res.json();
    container.innerHTML = `<p style="color:#D61F1F">Error: ${data.error || 'Failed to load'}</p>`;
    return;
  }
  
  const data = await res.json();
  if (data.queue.length === 0) {
    container.innerHTML = '<p class="muted">No files currently pending review.</p>';
    return;
  }
  
  container.innerHTML = data.queue.map(sub => `
    <div class="card">
      <strong style="font-size: 1.1rem;">${sub.title}</strong>
      <span class="muted">Course: ${sub.course_id} | Type: ${sub.type}</span>
      <span class="muted">Ticket: ${sub.ticket_number} | By: ${sub.contributor_name}</span>
      <span class="muted">Size: ${(sub.size_bytes / 1024 / 1024).toFixed(2)} MB</span>
      <div style="margin-top: 12px;">
        <a href="/review.html?id=${sub.id}" class="btn btn-blue">Review File</a>
      </div>
    </div>
  `).join('');
}
loadQueue();
