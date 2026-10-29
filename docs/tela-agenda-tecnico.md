# Agenda do técnico

## Objetivo

Implementar a aba **Agenda** do protótipo Figma com calendário mensal, marcação dos dias com eventos aceitos e gerenciamento de indisponibilidade diária.

## Comportamento da tela

- O mês atual abre por padrão. Os botões de seta navegam para mês anterior e seguinte.
- O calendário começa no domingo e completa a quantidade de semanas necessária para o mês. Os dias de meses adjacentes aparecem com menor contraste.
- O dia atual recebe um contorno, o dia selecionado fica em azul-marinho, datas indisponíveis ficam em coral claro e datas com evento recebem um ponto.
- Ao abrir a aba, a lista mostra os próximos compromissos aceitos no mês atual. Ao tocar em uma data, a lista passa a mostrar somente os eventos aceitos daquele dia.
- A lista apresenta títulos e horários derivados de `convites` e dos registros relacionados em `eventos` e `locais`.
- A ação **Adicionar indisponibilidade** confirma antes de gravar o dia. Uma data com evento aceito não pode ser bloqueada; para remover uma indisponibilidade o técnico seleciona o dia e confirma a remoção.
- Estados de carregamento, erro e calendário sem eventos são apresentados sem esconder os controles de navegação.

## Persistência

Os eventos deverão vir de `convites` filtrados por `id_usuario`, cruzados com `eventos` pelos campos `id_evento` e `id_empresa`; a agenda mostra convites aceitos. Indisponibilidades pertencem a `indisponibilidade/{id_indisponibilidade}` e usam `id_usuario` e `chave_data`.

O serviço deve permitir apenas o UID da sessão autenticada, armazenar `id_usuario`, `data`, `chave_data`, `motivo` e `criado_em`, e remover o documento quando o usuário libera a data. O identificador determinístico impede que o mesmo funcionário crie mais de um registro para o mesmo dia.

## Prévia local

Em `http://localhost:8081/?preview=technician`, eventos são fictícios e indisponibilidades ficam somente no estado da tela, sem gravação no Firestore. Com uma conta autenticada, o calendário assina e grava a coleção real.

## Arquivos

- `src/screens/TechnicianDashboardScreen.js`: navegação do calendário, seleção de datas, lista dos compromissos e confirmação de indisponibilidade.
- `src/styles/technicianDashboardStyles.js`: calendário, estados dos dias, legenda e linhas de eventos.
- `src/servicos/servicoIndisponibilidade.js`: assinatura, marcação e remoção de datas no Firestore (a coleção ainda precisa ser migrada para `indisponibilidade`).
- `docs/dicionario-de-dados.md`: definição da coleção `indisponibilidade` e da consulta da agenda.

## Segurança e limites

As regras versionadas em [`firestore.rules`](../firestore.rules) permitem que o funcionário consulte, crie e remova somente documentos de `indisponibilidade` cujo `id_usuario` seja o próprio UID. A checagem no serviço cliente é apenas uma defesa adicional.

Esta tela representa disponibilidade por dia inteiro. Faixas de horário, motivo, recorrência e bloqueios parciais não estão no modelo desta etapa. O app não envia notificações quando uma data é alterada.
