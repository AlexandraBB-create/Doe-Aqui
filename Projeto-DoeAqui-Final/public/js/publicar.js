requireAuth();

const form = document.querySelector("#donation-form");
const feedback = document.querySelector("#feedback");

form.addEventListener("submit", async event => {
  event.preventDefault();

  const values = Object.fromEntries(new FormData(form));

  try {
    feedback.className = "feedback";
    feedback.textContent = "Publicando...";

    await api.request("/api/doacoes", {
      method: "POST",
      body: JSON.stringify(values)
    });

    feedback.className = "feedback success";
    feedback.textContent = "Doação publicada com sucesso.";
    form.reset();

    setTimeout(() => {
      location.href = "/painel.html";
    }, 700);
  } catch (error) {
    feedback.className = "feedback error";
    feedback.textContent = error.message;
  }
});
