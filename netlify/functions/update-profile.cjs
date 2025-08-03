const { verifyToken, updateUser } = require('./lib/auth-server.cjs');

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
  const { name } = JSON.parse(event.body);

  if (!name) {
    return { statusCode: 400, body: 'Name is required' };
  }

  try {
    console.log(`Updating user ${id} with name ${name}`);
    const updatedUser = await updateUser(id, { name });
    if (!updatedUser) {
      console.error(`User not found or update failed for user id: ${id}`);
      return { statusCode: 404, body: 'User not found or update failed' };
    }
    console.log(`Successfully updated user ${id}`);
    return {
      statusCode: 200,
      body: JSON.stringify(updatedUser),
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
