import dadosMemoria from './dadosMemoria';

export const repositorioEventos = {
  // Listar todos os eventos da empresa
  listarEventos: async () => {
    return dadosMemoria.eventos;
  },

  // Obter opções para alimentar os selects dinâmicos das telas de cadastro
  obterOpcoesSelect: async (tipoEntidade) => {
    switch (tipoEntidade) {
      case 'tiposEvento':
        return dadosMemoria.tiposEvento;
      case 'tiposProfissional':
        return dadosMemoria.tiposProfissional;
      case 'tiposLocal':
        return dadosMemoria.tiposLocal;
      case 'locaisSalvos':
        return dadosMemoria.locaisSalvos;
      case 'clientes':
        return dadosMemoria.clientes;
      default:
        return [];
    }
  },

  // Select Inteligente: Adiciona um novo tipo/cadastro na hora (via modal) e retorna o item criado
  adicionarNovoItemSelect: async (tipoEntidade, dadosNovoItem) => {
    const novoId = String(Date.now());
    const itemCriado = {
      id: novoId,
      empresaId: dadosMemoria.empresaId,
      ...dadosNovoItem
    };

    switch (tipoEntidade) {
      case 'tiposEvento':
        dadosMemoria.tiposEvento.push(itemCriado);
        break;
      case 'tiposProfissional':
        dadosMemoria.tiposProfissional.push(itemCriado);
        break;
      case 'tiposLocal':
        dadosMemoria.tiposLocal.push(itemCriado);
        break;
      case 'locaisSalvos':
        dadosMemoria.locaisSalvos.push(itemCriado);
        break;
      case 'clientes':
        dadosMemoria.clientes.push(itemCriado);
        break;
    }

    return itemCriado;
  },

  // Criar um novo evento completo no repositório
  criarEvento: async (novoEvento) => {
    const id = String(Date.now());
    const eventoCompleto = {
      id,
      empresaId: dadosMemoria.empresaId,
      ...novoEvento
    };
    dadosMemoria.eventos.unshift(eventoCompleto);
    return eventoCompleto;
  }
};

export default repositorioEventos;
