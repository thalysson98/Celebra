# Detalhes do evento para técnico

## Objetivo

Registrar a tela de detalhe baseada no frame **Detalhes do evento** do Figma. O técnico chega a ela ao tocar em um evento nas abas Início, Eventos ou Agenda.

## Interface e navegação

- O cabeçalho azul-marinho contém voltar e o título **Detalhes do evento**.
- As abas **Geral**, **Locais** e **Equipe** alternam o conteúdo sem sair do detalhe.
- A área de destaque apresenta tipo, título, data e horário. Se houver `coverImageUrl`, ela é exibida; sem uma imagem cadastrada, a tela usa uma ilustração local.
- **Geral** mostra o cliente, notas da produção e os dados disponíveis da função, horário e quantidade de convidados.
- **Locais** apresenta endereços e instruções cadastrados. Na ausência de `eventLocations`, usa o endereço resumido da convocação como local principal.
- **Equipe** mostra os integrantes fornecidos no snapshot `teamMembers`. Como o modelo atual consulta convocações individuais do técnico, sem essa lista a tela apresenta a participação do usuário atual e explica que os demais integrantes não estão disponíveis nesse registro.
- O botão voltar fecha o detalhe e retorna à aba de origem. A navegação inferior fica oculta durante o detalhe, como na referência do Figma.

## Origem e disponibilidade dos dados

A tela deverá reutilizar o convite de `convites` e carregar os dados relacionados de `eventos`, `clientes` e `locais` pelos respectivos IDs. Não altera documentos. Endereços, clientes e metadados são mostrados apenas quando presentes; conteúdo ausente recebe um estado explicativo.

Campos opcionais que a interface reconhece: `clientEmail`, `clientPhone`, `eventLocations`, `productionNotes` (ou `notes`), `guestCount`, `teamMembers` e `coverImageUrl`. Sua inclusão na tela não significa que esses dados já estejam sendo preenchidos no Firestore. Consulte o [dicionário de dados](dicionario-de-dados.md) para a descrição e os cuidados de acesso.

## Arquivos

- `src/screens/TechnicianDashboardScreen.js`: seleciona o evento e controla a aba de detalhe e o retorno à aba de origem.
- `src/screens/TechnicianEventDetailsScreen.js`: cabeçalho, destaque, abas e conteúdo de Geral, Locais e Equipe.
- `src/styles/technicianEventDetailsStyles.js`: estilos isolados da tela, usando a paleta já adotada pelo app.
- `docs/tela-eventos-tecnico.md`: atualizado para documentar a abertura dos detalhes a partir da lista.

## Visualização

Inicie a aplicação web com `npm run web` e acesse `http://localhost:8081/?preview=technician`. Abra **Eventos** e toque em um cartão; também é possível abrir pelo evento destacado em **Início** ou pelas linhas da **Agenda**. Use o botão de voltar para retornar à aba de origem.

## Limites e próximos passos

- Os dados atuais não incluem imagem, contatos do cliente, notas, locais detalhados, quantidade de convidados ou a equipe completa. Esses blocos só ficam completos quando a convocação os disponibilizar.
- A lista atual de convites não oferece uma consulta da equipe por `id_evento`; por isso o fallback não inventa nem busca nomes de outros profissionais.
- Esta etapa é somente leitura. Edição do evento, contato direto com o cliente, mapas e mudanças em convocações não foram adicionados.
