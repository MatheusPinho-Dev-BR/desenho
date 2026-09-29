const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let svgAtual = "";
let idTokenGoogle = "";

// A Google exige que a função de callback esteja disponível globalmente no window
window.lidarComLoginGoogle = function(resposta) {
  idTokenGoogle = resposta.credential;
  mensagem.textContent = "Login efetuado com sucesso! Agora pode clicar em Desenhar.";
  mensagem.style.color = "green";
};

// Validação simples substituindo a importação que foi removida
function numeroValido(n) {
  return Number.isInteger(n) && n >= 1 && n <= 100;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  mensagem.style.color = "inherit";

  const numero = Number(campoNumero.value);

  if (!numeroValido(numero)) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }

  if (!idTokenGoogle) {
    mensagem.textContent = "Por favor, faça login com a conta Google primeiro.";
    return;
  }

  mensagem.textContent = "A gerar o desenho no servidor...";

  try {
    // Pedido POST para a Pages Function
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idTokenGoogle}`
      },
      body: JSON.stringify({ numero: numero })
    });

    if (!resposta.ok) {
      throw new Error(`Erro de servidor ou de validação (Status: ${resposta.status})`);
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
    mensagem.textContent = "";

  } catch (erro) {
    mensagem.textContent = "Erro: " + erro.message;
    console.error(erro);
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});
