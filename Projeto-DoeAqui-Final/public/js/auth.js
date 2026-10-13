const form = document.querySelector("form");
const feedback = document.querySelector("#feedback");
const mode = form.dataset.mode;

form.addEventListener("submit", async event => {
  event.preventDefault();

  feedback.className = "feedback";
  feedback.textContent = "Processando...";

  const values = Object.fromEntries(new FormData(form));

  try {
    const data = await api.request(
      mode === "login" ? "/api/auth/login" : "/api/auth/cadastro",
      {
        method: "POST",
        body: JSON.stringify(values)
      }
    );

    api.setSession(data);
    location.href = "/painel.html";
  } catch (error) {
    feedback.className = "feedback error";
    feedback.textContent = error.message;
  }
});
