const { dbHelpers } = require('./lib/database-server.cjs');

exports.handler = async function(event, context) {
  const { token } = event.queryStringParameters;
  console.log('Confirmation token:', token);

  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Confirmation token is required' }),
    };
  }

  try {
    const user = await dbHelpers.getUserByConfirmationToken(token);
    console.log('User found:', user);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Invalid or expired confirmation token' }),
      };
    }

    await dbHelpers.updateUser(user.id, {
      email_confirmed: true,
      confirmation_token: null,
    });

    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.VITE_APP_URL}/login?email_confirmed=true`,
      },
    };
  } catch (error) {
    console.error('Error confirming email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal server error occurred' }),
    };
  }
};
