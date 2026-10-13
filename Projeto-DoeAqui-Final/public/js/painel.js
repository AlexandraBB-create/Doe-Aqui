requireAuth();

const myDonations = document.querySelector("#my-donations");
const received = document.querySelector("#received-requests");
const sent = document.querySelector("#sent-requests");

async function loadDashboard() {
  try {
    const [donations, receivedRequests, sentRequests] = await Promise.all([
      api.request("/api/doacoes/minhas"),
      api.request("/api/solicitacoes/recebidas"),
      api.request("/api/solicitacoes/enviadas")
    ]);

    renderDonations(donations);
    renderReceived(receivedRequests);
    renderSent(sentRequests);
  } catch (error) {
    alert(error.message);
  }
}

function renderDonations(items) {
  myDonations.innerHTML = items.length
    ? items.map(item => `
        <div class="item">
          <h3>${escapeHtml(item.title)}</h3>
          <p class="meta">
            ${escapeHtml(item.type)} - ${escapeHtml(item.status)}
          </p>
          <div class="card-actions">
            ${item.status === "RESERVADA"
              ? `<button class="btn small green"
                   onclick="changeDonationStatus(${item.id}, 'CONCLUIDA')">
                   Concluir
                 </button>`
              : ""}
            ${!["CONCLUIDA", "CANCELADA"].includes(item.status)
              ? `<button class="btn small orange"
                   onclick="changeDonationStatus(${item.id}, 'CANCELADA')">
                   Cancelar
                 </button>`
              : ""}
            <button class="btn small danger"
              onclick="deleteDonation(${item.id})">
              Excluir
            </button>
          </div>
        </div>
      `).join("")
    : '<div class="empty">Você ainda não publicou doações.</div>';
}

function renderReceived(items) {
  received.innerHTML = items.length
    ? items.map(item => `
        <div class="item">
          <h3>${escapeHtml(item.title)}</h3>
          <p>
            <strong>${escapeHtml(item.requester_name)}</strong>:
            ${escapeHtml(item.message)}
          </p>
          <p class="meta">Status: ${escapeHtml(item.status)}</p>
          ${item.status === "PENDENTE"
            ? `<div class="card-actions">
                 <button class="btn small green"
                   onclick="answerRequest(${item.id}, 'ACEITA')">
                   Aceitar
                 </button>
                 <button class="btn small danger"
                   onclick="answerRequest(${item.id}, 'RECUSADA')">
                   Recusar
                 </button>
               </div>`
            : ""}
        </div>
      `).join("")
    : '<div class="empty">Nenhuma solicitação recebida.</div>';
}

function renderSent(items) {
  sent.innerHTML = items.length
    ? items.map(item => `
        <div class="item">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.message)}</p>
          <p class="meta">
            Doador: ${escapeHtml(item.owner_name)} -
            Status: ${escapeHtml(item.status)}
          </p>
        </div>
      `).join("")
    : '<div class="empty">Nenhuma solicitação enviada.</div>';
}

async function answerRequest(id, status) {
  try {
    await api.request(`/api/solicitacoes/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });

    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function changeDonationStatus(id, status) {
  try {
    await api.request(`/api/doacoes/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });

    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

async function deleteDonation(id) {
  if (!confirm("Deseja realmente excluir esta doação?")) return;

  try {
    await api.request(`/api/doacoes/${id}`, {
      method: "DELETE"
    });

    loadDashboard();
  } catch (error) {
    alert(error.message);
  }
}

loadDashboard();
