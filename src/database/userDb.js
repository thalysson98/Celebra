import AsyncStorage from '@react-native-async-storage/async-storage';

const ASYNC_STORAGE_KEY = '@celebra:users_db';

// Inicializa a tabela e insere usuário padrão
export async function initUserDb() {
  try {
    const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
    if (!stored) {
      const initialUsers = [
        {
          id: 1,
          name: 'Administrador Celebra',
          username: 'admin',
          password: 'admin123',
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Jordan Lee',
          username: 'jordan',
          password: '123456',
          created_at: new Date().toISOString(),
        },
      ];
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(initialUsers));
    }
    return true;
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    return false;
  }
}

// 1. CREATE: Cria um novo usuário
export async function createUser(name, username, password) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanName = name.trim();

  const existing = await getUserByUsername(cleanUsername);
  if (existing) {
    throw new Error('Este nome de usuário ou e-mail já está cadastrado.');
  }

  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: newId,
    name: cleanName,
    username: cleanUsername,
    password: password,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(users));
  return { id: newUser.id, name: newUser.name, username: newUser.username };
}

// 2. READ: Busca todos os usuários
export async function getAllUsers() {
  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];
  return users.map(({ password, ...u }) => u);
}

// 2. READ: Busca usuário por username
export async function getUserByUsername(username) {
  const cleanUsername = username.trim().toLowerCase();
  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];
  return users.find((u) => u.username.toLowerCase() === cleanUsername) || null;
}

// 2. READ: Autenticação de Login
export async function authenticateUser(username, password) {
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }
  if (user.password === password) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// 3. UPDATE: Atualiza os dados de um usuário
export async function updateUser(id, name, username, newPassword = null) {
  const cleanUsername = username.trim().toLowerCase();
  const cleanName = name.trim();

  const existing = await getUserByUsername(cleanUsername);
  if (existing && existing.id !== id) {
    throw new Error('Este nome de usuário ou e-mail já pertence a outra conta.');
  }

  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) {
    throw new Error('Usuário não encontrado.');
  }
  users[index].name = cleanName;
  users[index].username = cleanUsername;
  if (newPassword && newPassword.trim().length > 0) {
    users[index].password = newPassword;
  }
  await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(users));
  return { id, name: cleanName, username: cleanUsername };
}

// 4. DELETE: Remove um usuário do banco
export async function deleteUser(id) {
  const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  const users = stored ? JSON.parse(stored) : [];
  const filtered = users.filter((u) => u.id !== id);
  await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
