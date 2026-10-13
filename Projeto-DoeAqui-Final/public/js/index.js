const list = document.querySelector("#donations");
const form = document.querySelector("#search-form");

function donationCard(donation) {
  const fallback =
    donation.type === "SERVICO"
      ? "[placehold.co](https://placehold.co/600x360/e5f8df/188a40?text=Serviço)"
      : "[placehold.co](https://placehold.co/600x360/e3f3ff/06488d?text=Bem)";

  return `
    <article class="card">
      <img
        class="card-image"
        src="${escapeHtml(donation.image_url || fallback)}"
        alt="${escapeHtml(donation.title)}"
        onerror="this.src='${fallback}'"
      >
      <div class="card-body">
        <span class="badge ${donation.type === "SERVICO" ? "service" : ""}">
          ${donation.type === "SERVICO" ? "Serviço" : "Bem"}
        </span>
        <h3>${escapeHtml(donation.title)}</h3>
        <p>${escapeHtml(donation.description)}</p>
        <p class="meta">
          ${escapeHtml(donation.category)} -
          ${escapeHtml(donation.city)}/${escapeHtml(donation.state)}
        </p>
        <p class="meta">Por ${escapeHtml(donation.owner_name)}</p>
        <button
          class="btn green"
          onclick="requestDonation(${donation.id})"
        >
          Tenho interesse
        </button>
      </div>
    </article>
  `;
}

async function loadDonations() {
  const parameters = new URLSearchParams(new FormData(form));

  try {
    list.innerHTML = "<p>Carregando doações...</p>";

    const donations = await api.request(
      `/api/doacoes?${parameters.toString()}`
    );

    list.innerHTML = donations.length
      ? donations.map(donationCard).join("")
      : '<div class="empty">Nenhuma doação encontrada.</div>';
  } catch (error) {
    list.innerHTML = `<div class="empty">${escapeHtml(error.message)}</div>`;
  }
}

async function requestDonation(donationId) {
  if (!api.token()) {
    location.href = "/login.html";
    return;
  }

  const message = window.prompt(
    "Explique brevemente por que você precisa desta doação:"
  );

  if (!message?.trim()) return;

  try {
    await api.request("/api/solicitacoes", {
      method: "POST",
      body: JSON.stringify({ donationId, message })
    });

    alert("Solicitação enviada ao doador.");
  } catch (error) {
    alert(error.message);
  }
}

form.addEventListener("submit", event => {
  event.preventDefault();
  loadDonations();
});

loadDonations();
