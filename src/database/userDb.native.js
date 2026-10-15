import * as SQLite from 'expo-sqlite';

const DB_NAME = 'celebra_app.db';

const SQL_CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

let dbInstance = null;

// Inicializa e conecta ao banco de dados SQLite nativo
export async function openUserDb() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await dbInstance.execAsync(SQL_CREATE_USERS_TABLE);
  }
  return dbInstance;
}

// Inicializa a tabela e insere usuário padrão
export async function initUserDb() {
  try {
    const db = await openUserDb();
    const existing = await db.getAllAsync('SELECT * FROM users LIMIT 1');
    if (!existing || existing.length === 0) {
      await db.runAsync(
        'INSERT INTO users (name, username, password) VALUES (?, ?, ?)',
        ['Administrador Celebra', 'admin', 'admin123']
      );
      await db.runAsync(
        'INSERT INTO users (name, username, password) VALUES (?, ?, ?)',
        ['Jordan Lee', 'jordan', '123456']
      );
    }
    return true;
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados nativo:', error);
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

  const db = await openUserDb();
  const result = await db.runAsync(
    'INSERT INTO users (name, username, password) VALUES (?, ?, ?)',
    [cleanName, cleanUsername, password]
  );
  return {
    id: result.lastInsertRowId,
    name: cleanName,
    username: cleanUsername,
  };
}

// 2. READ: Busca todos os usuários
export async function getAllUsers() {
  const db = await openUserDb();
  const rows = await db.getAllAsync(
    'SELECT id, name, username, created_at FROM users ORDER BY id DESC'
  );
  return rows || [];
}

// 2. READ: Busca usuário por username
export async function getUserByUsername(username) {
  const cleanUsername = username.trim().toLowerCase();
  const db = await openUserDb();
  const user = await db.getFirstAsync(
    'SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1',
    [cleanUsername]
  );
  return user || null;
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

  const db = await openUserDb();
  if (newPassword && newPassword.trim().length > 0) {
    await db.runAsync(
      'UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?',
      [cleanName, cleanUsername, newPassword, id]
    );
  } else {
    await db.runAsync(
      'UPDATE users SET name = ?, username = ? WHERE id = ?',
      [cleanName, cleanUsername, id]
    );
  }
  return { id, name: cleanName, username: cleanUsername };
}

// 4. DELETE: Remove um usuário do banco
export async function deleteUser(id) {
  const db = await openUserDb();
  await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
  return true;
}
