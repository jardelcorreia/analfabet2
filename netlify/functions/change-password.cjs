const { verifyToken, changePassword } = require('./lib/auth-server.cjs');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { token } = event.headers;
  const decoded = verifyToken(token);

  if (!decoded) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  const { id } = decoded;
  const { currentPassword, newPassword } = JSON.parse(event.body);

  if (!currentPassword || !newPassword) {
    return { statusCode: 400, body: 'Current password and new password are required' };
  }

  try {
    const success = await changePassword(id, currentPassword, newPassword);
    if (!success) {
      return { statusCode: 500, body: 'Failed to change password' };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Password changed successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 400, // Using 400 for errors like "incorrect password"
      body: JSON.stringify({ error: error.message }),
    };
  }
};
