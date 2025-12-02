# Funcionalidade de Alteração de Senha do Motorista

## Descrição
O sistema agora permite que o administrador altere a senha de qualquer motorista de forma simples e segura.

## Como Usar

### 1. Acessar o Gerenciamento de Motoristas
- Faça login como administrador
- Clique no menu "Configurações" (ícone de engrenagem)
- Selecione "Motoristas"

### 2. Alterar a Senha de um Motorista
Existem duas formas de alterar a senha:

#### Opção 1: Através do botão "Alterar Senha" (Recomendado)
1. Na lista de motoristas, localize o motorista desejado
2. Clique no botão **"Alterar Senha"** (ícone de cadeado)
3. Um modal será aberto solicitando a nova senha
4. Digite a nova senha (mínimo 6 caracteres)
5. Clique em "Alterar Senha" para confirmar
6. Uma notificação confirmará o sucesso da operação

#### Opção 2: Através do modo de edição
1. Clique no botão "Editar" do motorista
2. Clique no botão "Resetar Senha"
3. Siga os mesmos passos do modal (itens 3-6 acima)

## Validações de Segurança

### Permissões
- **Apenas administradores** podem alterar senhas de motoristas
- Motoristas não podem alterar senhas de outros motoristas
- O sistema verifica automaticamente as permissões

### Requisitos da Senha
- Mínimo de 6 caracteres
- A senha não pode estar vazia
- A senha é criptografada antes de ser armazenada no banco de dados

## Segurança Implementada

1. **Criptografia**: As senhas são armazenadas usando hash com salt único
2. **Validação de Permissões**: Apenas administradores podem resetar senhas
3. **Feedback Visual**: Notificações claras de sucesso ou erro
4. **Interface Intuitiva**: Modal dedicado com validação em tempo real

## Observações Importantes

- A alteração de senha é imediata
- O motorista precisará usar a nova senha no próximo login
- Não é possível recuperar senhas antigas (apenas resetar)
- Recomenda-se informar o motorista sobre a nova senha de forma segura

## Tecnologias Utilizadas

- React com TypeScript
- Firebase Firestore para armazenamento
- Criptografia com salt único por usuário
- Interface responsiva com validação em tempo real
