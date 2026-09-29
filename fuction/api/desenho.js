// Importa a função do ficheiro que movemos para a pasta lib/
import { gerarDesenho } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Verificação do Método (Erro 405)
  if (request.method !== "POST") {
    return new Response("Método não permitido", { status: 405 });
  }

  // 2. Verificação do Corpo e do Número (Erro 400)
  let corpo;
  try {
    corpo = await request.json();
  } catch (erro) {
    return new Response("Corpo da requisição inválido", { status: 400 });
  }

  const numero = corpo.numero;
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    return new Response("Número inválido ou fora dos limites (1 a 100)", { status: 400 });
  }

  // 3. Verificação do Token da Google (Erro 401)
  const autorizacao = request.headers.get("Authorization");
  if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
    return new Response("Token ausente ou mal formatado", { status: 401 });
  }

  const token = autorizacao.substring(7); // Remove a palavra "Bearer "
  
  // Chamada ao Google para validar o token
  const respostaGoogle = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
  
  if (!respostaGoogle.ok) {
    return new Response("Token inválido", { status: 401 });
  }

  const dadosToken = await respostaGoogle.json();

  // Verifica se o token pertence à sua aplicação (Client ID configurado no Cloudflare)
  if (dadosToken.aud !== env.GOOGLE_CLIENT_ID) {
    return new Response("Token pertence a outro Client ID", { status: 401 });
  }

  // Verifica se o e-mail foi realmente validado pela Google
  if (dadosToken.email_verified !== "true" && dadosToken.email_verified !== true) {
    return new Response("E-mail não verificado", { status: 401 });
  }

  const emailUsuario = dadosToken.email;

  // 4. Geração do Desenho e Resposta de Sucesso (200)
  const svg = gerarDesenho(numero, emailUsuario);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml"
    }
  });
}
