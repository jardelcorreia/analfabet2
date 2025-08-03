const { verifyToken } = require('./lib/auth-server.cjs');
const { dbHelpers } = require('./lib/database-server.cjs');

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

  try {
    const deletedUser = await dbHelpers.deleteUser(id);
    if (!deletedUser) {
      return { statusCode: 404, body: 'User not found' };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Account deleted successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
