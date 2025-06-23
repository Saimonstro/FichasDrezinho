// Função que será executada quando o botão "Desbloquear Admin" for clicado
document.getElementById("unlock-admin").addEventListener("click", function () {
  // Obtem o valor da senha digitada no campo de senha
  const password = document.getElementById("admin-password").value;

  // Definição da senha correta de administrador
  const adminPassword = "teste123";

  // Verifica se a senha digitada é igual à senha de admin
  if (password === adminPassword) {
    // Mostra a seção de formulário e a seção de usuários cadastrados
    document.getElementById("form-section").style.display = "block";
    document.getElementById("usuarios-section").style.display = "block";

    // Habilita os campos de nome, fichas e observações para edição
    document.getElementById("save").disabled = false;
    document.getElementById("nome").disabled = false;
    document.getElementById("fichas").disabled = false;
    document.getElementById("observacoes").disabled = false;

    // Habilita o botão de mostrar usuários
    document.getElementById("show-users").disabled = false;

    // Limpa qualquer mensagem de erro de senha incorreta
    document.getElementById("error-message-admin").textContent = "";
  } else {
    // Exibe mensagem de erro caso a senha esteja incorreta
    document.getElementById("error-message-admin").textContent =
      "Senha incorreta! Tente novamente.";
  }
});

// Variável para manter o valor das fichas (agora pode ser negativo)
let fichas = 0;

// Recupera o histórico do servidor
async function fetchHistorico() {
  const response = await fetch('/api/historico');
  if (!response.ok) {
    console.error('Erro ao carregar histórico');
    return [];
  }
  return await response.json();
}

// Função para definir o valor inicial de fichas
document.getElementById("fichas").addEventListener("input", function () {
  fichas = parseInt(this.value) || 0;
});

// Função para salvar os dados no banco de dados
document.getElementById("save").addEventListener("click", async function () {
  const nome = document.getElementById("nome").value;
  const observacoes = document.getElementById("observacoes").value;

  // Se o campo Nome estiver vazio, exibe uma mensagem de erro
  if (nome === "") {
    document.getElementById("error-message").textContent =
      "O campo Nome é obrigatório.";
    return;
  } else {
    document.getElementById("error-message").textContent = ""; // Limpa a mensagem de erro se o nome estiver preenchido
  }

  // Verifica se o valor de fichas foi alterado, se não foi, mantém o valor atual
  let fichasInput = document.getElementById("fichas").value;
  if (fichasInput === "" || fichasInput === "0") {
    // Caso o valor de fichas esteja vazio ou zero, mantém o valor atual
    fichasInput = fichas;
  } else {
    fichas = parseInt(fichasInput); // Atualiza o valor de fichas se for diferente de zero
  }

  // Obtém a data e formata no padrão DD/MM/YYYY
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const formattedDate = `${day}/${month}/${year}`; // Formato DD/MM/YYYY

  // Salva os dados localmente (simulando um banco de dados)
  const fichaData = {
    nome: nome,
    fichas: fichas, // Usa o valor atualizado de fichas
    observacoes: observacoes,
    data: formattedDate,
    hora: new Date().toLocaleTimeString(),
  };

  // Verifica se o nome já existe e se o usuário está editando um nome existente
  const isEditing =
    document.getElementById("nome").dataset.isEditing === "true";
  const originalNome =
    document.getElementById("nome").dataset.originalNome || "";

  if (isEditing || (await isUniqueName(nome))) {
    await saveToDatabase(fichaData, isEditing, originalNome); // Passa flag de edição
    addToHistorico(fichaData);

    if (!isEditing) {
      createNameListItem(nome, fichas, observacoes); // Adiciona à lista de nomes cadastrados
    } else {
      // Atualiza a exibição da lista usando o nome original para localizar o item
      updateNameListItem(originalNome, nome, fichas, observacoes);
    }

    // Limpa os campos após salvar
    document.getElementById("nome").value = "";
    document.getElementById("fichas").value = 0;
    document.getElementById("observacoes").value = "";
    fichas = 0;
    document.getElementById("nome").dataset.isEditing = "false"; // Reset da flag de edição
    document.getElementById("nome").dataset.originalNome = ""; // Limpa o nome original
  } else {
    document.getElementById("error-message").textContent =
      "Nome já cadastrado. Os nomes devem ser únicos.";
  }
});

// Função para verificar se o nome é único
async function isUniqueName(nome) {
  const historico = await fetchHistorico();
  return !historico.some(
    (item) => item.nome.toLowerCase() === nome.toLowerCase()
  );
}

// Função para adicionar a entrada ao histórico
function addToHistorico(data) {
  const historico = document.getElementById("historico");
  const listItem = document.createElement("li");

  // Aqui removemos a exibição das observações
  listItem.textContent = `${data.data} ${data.hora}: ${data.nome} tem ${data.fichas} fichas.`;

  historico.appendChild(listItem);
}

// Função simulada para salvar os dados em um banco (ajustado para DD-MM-YYYY)
async function saveToDatabase(data, isEditing = false, originalNome = "") {
  console.log("Salvando no banco de dados...", data);

  await fetch('/api/historico', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, isEditing, originalNome })
  });
}

// Função para mostrar o histórico e permitir filtragem
document
  .getElementById("show-historico")
  .addEventListener("click", async function () {
    const historicoList = document.getElementById("historico");
    const filterNome = document
      .getElementById("filter-nome")
      .value.toLowerCase();
    const filterData = document.getElementById("filter-data").value;

    historicoList.innerHTML = ""; // Limpa o histórico anterior

    // Filtra o histórico com base no nome e na data
    const historico = await fetchHistorico();
    const filteredHistorico = historico.filter((item) => {
      const matchesNome = filterNome
        ? item.nome.toLowerCase().includes(filterNome)
        : true;

      // Verifica se a data no histórico coincide com a data filtrada
      let matchesData = true;
      if (filterData) {
        // Aqui fazemos a verificação de data
        const [year, month, day] = filterData.split("-");
        const formattedFilterData = `${day}/${month}/${year}`; // Formata a data filtrada para DD/MM/YYYY
        matchesData = item.data === formattedFilterData; // Compara com a data armazenada
      }

      return matchesNome && matchesData;
    });

    // Ordena o histórico filtrado por data
    const sortedHistorico = filteredHistorico.sort((a, b) => {
      // Converte a data para o formato timestamp para comparação
      const dateA = new Date(
        `${a.data.split("/")[2]}-${a.data.split("/")[1]}-${
          a.data.split("/")[0]
        }T${a.hora}`
      );
      const dateB = new Date(
        `${b.data.split("/")[2]}-${b.data.split("/")[1]}-${
          b.data.split("/")[0]
        }T${b.hora}`
      );
      return dateB - dateA; // Ordem decrescente (do mais recente para o mais antigo)
    });

    // Adiciona os itens filtrados e ordenados ao histórico
    sortedHistorico.forEach((item) => addToHistorico(item));

    // Alterna a exibição do histórico
    historicoList.style.display =
      historicoList.style.display === "none" ? "block" : "none";
    this.textContent =
      historicoList.style.display === "none"
        ? "Mostrar Histórico"
        : "Ocultar Histórico"; // Muda o texto do botão
  });

// Função para mostrar a lista de usuários cadastrados
document.getElementById("show-users").addEventListener("click", async function () {
  const nameList = document.getElementById("name-list");
  nameList.innerHTML = ""; // Limpa a lista anterior

  const historico = await fetchHistorico();

  // Ordena os usuários alfabeticamente pelo nome
  const sortedHistorico = historico.sort((a, b) => {
    return a.nome.localeCompare(b.nome, "pt", { sensitivity: "base" });
  });

  // Cria os itens da lista com base na lista ordenada
  sortedHistorico.forEach((item) =>
    createNameListItem(item.nome, item.fichas, item.observacoes)
  );

  // Alterna a exibição da lista de usuários
  nameList.style.display = nameList.style.display === "none" ? "block" : "none";
  this.textContent =
    nameList.style.display === "none" ? "Mostrar Usuários" : "Ocultar Usuários"; // Muda o texto do botão
});

// Função para criar um item na lista de nomes cadastrados
function createNameListItem(nome, fichas, observacoes) {
  const nameList = document.getElementById("name-list");
  const listItem = document.createElement("li");
  listItem.dataset.nome = nome; // Facilita localizar o item posteriormente
  listItem.innerHTML = `
      <button class="edit-button" data-nome="${nome}" data-fichas="${fichas}" data-observacoes="${observacoes}">Editar</button>
      <button class="delete-button" data-nome="${nome}">Deletar</button>
      ${nome} - Fichas: ${fichas}, Observações: ${observacoes}
  `;

  nameList.appendChild(listItem);

  // Evento para editar o registro
  listItem.querySelector(".edit-button").addEventListener("click", function () {
    document.getElementById("nome").value = nome;
    document.getElementById("fichas").value = fichas;
    document.getElementById("observacoes").value = observacoes;
    document.getElementById("nome").dataset.isEditing = "true"; // Marca como edição
    document.getElementById("nome").dataset.originalNome = nome; // Armazena o nome original
  });

  // Evento para deletar o registro
  listItem
    .querySelector(".delete-button")
    .addEventListener("click", async function () {
      await deleteUser(nome);
      nameList.removeChild(listItem); // Remove o item da lista
    });
}

// Função para deletar um usuário do histórico
async function deleteUser(nome) {
  await fetch(`/api/historico?nome=${encodeURIComponent(nome)}`, {
    method: 'DELETE'
  });
}

// Função para atualizar um item da lista de nomes
function updateNameListItem(originalNome, novoNome, fichas, observacoes) {
  const items = document.querySelectorAll("#name-list li");
  items.forEach((item) => {
    if (item.dataset.nome === originalNome) {
      item.dataset.nome = novoNome;
      item.innerHTML = `
              <button class="edit-button" data-nome="${novoNome}" data-fichas="${fichas}" data-observacoes="${observacoes}">Editar</button>
              <button class="delete-button" data-nome="${novoNome}">Deletar</button>
              ${novoNome} - Fichas: ${fichas}, Observações: ${observacoes}
          `;
      // Adiciona novamente os eventos de editar e deletar
      item.querySelector(".edit-button").addEventListener("click", function () {
        document.getElementById("nome").value = novoNome;
        document.getElementById("fichas").value = fichas;
        document.getElementById("observacoes").value = observacoes;
        document.getElementById("nome").dataset.isEditing = "true"; // Marca como edição
        document.getElementById("nome").dataset.originalNome = novoNome; // Armazena o nome original
      });

      item
        .querySelector(".delete-button")
        .addEventListener("click", async function () {
          await deleteUser(novoNome);
          document.getElementById("name-list").removeChild(item); // Remove o item da lista
        });
    }
  });
}
