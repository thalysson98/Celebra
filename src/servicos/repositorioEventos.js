import { bancoMemoria } from './dadosMemoria';

// 1. Buscar todos os eventos
export const buscarEventos = async () => {
  return [...bancoMemoria.eventos];
};

// 2. Buscar evento por ID
export const buscarEventoPorId = async (idEvento) => {
  const evento = bancoMemoria.eventos.find((e) => e.id === idEvento);
  return evento ? { ...evento } : null;
};

// 3. Criar um novo evento
export const criarEvento = async (dadosEvento) => {
  const novoId = String(Date.now());
  const novoEvento = {
    id: novoId,
    ...dadosEvento,
    fornecedores: [],
    atracoes: [],
    criadoEm: new Date().toISOString()
  };

  bancoMemoria.eventos.push(novoEvento);
  return novoId;
};

// 4. Adicionar fornecedor ao evento
export const adicionarFornecedorAoEvento = async (idEvento, dadosFornecedor) => {
  const evento = bancoMemoria.eventos.find((e) => e.id === idEvento);
  if (!evento) throw new Error('Evento não encontrado');

  const novoFornecedor = {
    id: String(Date.now()),
    ...dadosFornecedor
  };

  evento.fornecedores.push(novoFornecedor);
  return novoFornecedor.id;
};