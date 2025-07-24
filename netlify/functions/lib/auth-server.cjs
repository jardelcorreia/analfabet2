const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbHelpers } = require('./database-server.cjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.VITE_JWT_SECRET || 'fallback-secret';

// Função para detectar se o identificador é um email
const isEmailFormat = (identifier) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(identifier);
};

// Função para validar nome de usuário
const isValidUsername = (username) => {
  // Nome deve ter pelo menos 2 caracteres e não conter @ ou espaços
  return username.length >= 2 && !username.includes('@') && !username.includes(' ');
};

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

const sendConfirmationEmail = async (user, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const confirmationUrl = `${process.env.VITE_APP_URL}/confirm-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: 'Confirme seu email',
    html: `Olá ${user.name},<br><br>Obrigado por se registrar! Por favor, clique no link a seguir para confirmar seu email:<br><br><a href="${confirmationUrl}">${confirmationUrl}</a><br><br>Se você não se registrou, ignore este email.<br><br>Atenciosamente,<br>Equipe AnalfaBet`,
  });
};

const signUp = async (email, password, name) => {
  // Validações básicas
  if (!email || !password || !name) {
    throw new Error('Email, senha e nome são obrigatórios');
  }

  if (!isEmailFormat(email)) {
    throw new Error('Formato de email inválido');
  }

  if (!isValidUsername(name)) {
    throw new Error('Nome de usuário deve ter pelo menos 2 caracteres e não conter @ ou espaços');
  }

  if (password.length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres');
  }

  // Verificar se email já existe
  const existingUserByEmail = await dbHelpers.getUserByEmail(email);
  if (existingUserByEmail) {
    throw new Error('Este email já está em uso');
  }

  // Verificar se nome de usuário já existe
  const existingUserByName = await dbHelpers.getUserByName(name);
  if (existingUserByName) {
    throw new Error('Este nome de usuário já está em uso');
  }

  const hashedPassword = await hashPassword(password);
  const confirmationToken = crypto.randomBytes(32).toString('hex');

  const user = await dbHelpers.createUser(email, hashedPassword, name, confirmationToken);

  if (!user || typeof user.id === 'undefined') {
    throw new Error('Falha ao criar usuário. Tente novamente.');
  }

  await sendConfirmationEmail(user, confirmationToken);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at
  };
};

const signIn = async (identifier, password) => {
  // Validações básicas
  if (!identifier || !password) {
    throw new Error('Identificador e senha são obrigatórios');
  }

  let user;

  try {
    // Determinar se o identificador é email ou nome de usuário
    if (isEmailFormat(identifier)) {
      // É um email
      user = await dbHelpers.getUserByEmail(identifier);
    } else {
      // É um nome de usuário
      if (!isValidUsername(identifier)) {
        throw new Error('Nome de usuário inválido');
      }
      user = await dbHelpers.getUserByName(identifier);
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw new Error('Erro interno do servidor');
  }

  if (!user) {
    return null; // Usuário não encontrado
  }

  if (!user.email_confirmed) {
    throw new Error('Please confirm your email before logging in.');
  }

  const isValid = await comparePassword(password, user.password_hash);

  if (!isValid) {
    return null; // Senha inválida
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at
  };
};

// Função auxiliar para verificar se um email está disponível
const isEmailAvailable = async (email) => {
  if (!isEmailFormat(email)) {
    return false;
  }

  const user = await dbHelpers.getUserByEmail(email);
  return !user;
};

// Função auxiliar para verificar se um nome de usuário está disponível
const isUsernameAvailable = async (username) => {
  if (!isValidUsername(username)) {
    return false;
  }

  const user = await dbHelpers.getUserByName(username);
  return !user;
};

// Função para buscar usuário por ID (útil para middleware de autenticação)
const getUserById = async (id) => {
  try {
    const user = await dbHelpers.getUserById(id);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    return null;
  }
};

// Função para atualizar dados do usuário
const updateUser = async (id, updates) => {
  try {
    // Validar atualizações
    if (updates.email && !isEmailFormat(updates.email)) {
      throw new Error('Formato de email inválido');
    }

    if (updates.name && !isValidUsername(updates.name)) {
      throw new Error('Nome de usuário inválido');
    }

    if (updates.password && updates.password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    // Verificar conflitos
    if (updates.email) {
      const existingUser = await dbHelpers.getUserByEmail(updates.email);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Este email já está em uso');
      }
    }

    if (updates.name) {
      const existingUser = await dbHelpers.getUserByName(updates.name);
      if (existingUser && existingUser.id !== id) {
        throw new Error('Este nome de usuário já está em uso');
      }
    }

    // Hash da nova senha se fornecida
    if (updates.password) {
      updates.password = await hashPassword(updates.password);
    }

    const user = await dbHelpers.updateUser(id, updates);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

// Função para alterar senha com verificação da senha atual
const changePassword = async (id, currentPassword, newPassword) => {
  try {
    const user = await dbHelpers.getUserById(id);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password_hash);

    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta');
    }

    // Validar nova senha
    if (newPassword.length < 6) {
      throw new Error('Nova senha deve ter pelo menos 6 caracteres');
    }

    // Hash da nova senha
    const hashedNewPassword = await hashPassword(newPassword);

    // Atualizar senha
    await dbHelpers.updateUser(id, { password: hashedNewPassword });

    return true;
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    throw error;
  }
};

// Função para validar token e retornar dados do usuário
const validateTokenAndGetUser = async (token) => {
  try {
    const decoded = verifyToken(token);

    if (!decoded) {
      return null;
    }

    // Verificar se o usuário ainda existe no banco
    const user = await getUserById(decoded.id);

    return user;
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return null;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  signUp,
  signIn,
  isEmailAvailable,
  isUsernameAvailable,
  getUserById,
  updateUser,
  changePassword,
  validateTokenAndGetUser
};
