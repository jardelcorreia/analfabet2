const { dbHelpers } = require('./lib/database-server.cjs');

exports.handler = async function(event, context) {
  console.log('confirm-email function invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  const { token } = event.queryStringParameters || {};
  console.log('Confirmation token:', token);

  if (!token) {
    console.log('No token provided');
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Confirmation token is required' }),
    };
  }

  try {
    // Step 1: Find user by token
    console.log('Looking for user with token:', token);
    const user = await dbHelpers.getUserByConfirmationToken(token);
    console.log('User found by token:', user);

    if (!user) {
      console.log('No user found with this token');
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid or expired confirmation token' }),
      };
    }

    if (user.email_confirmed) {
      console.log('Email already confirmed for user:', user.id);
      return {
        statusCode: 302,
        headers: {
          Location: `${process.env.VITE_APP_URL}login?email_confirmed=true&already_confirmed=true`,
        },
      };
    }

    // Step 2: Confirm the email using the specific function
    console.log('Confirming email for user ID:', user.id);
    const updatedUser = await dbHelpers.confirmUserEmail(user.id);
    console.log('Email confirmation completed:', updatedUser);

    // Step 3: Verify the update worked
    const verifyUser = await dbHelpers.getUserById(user.id);
    console.log('Verification - user after update:', {
      id: verifyUser.id,
      email_confirmed: verifyUser.email_confirmed,
      confirmation_token: verifyUser.confirmation_token
    });

    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.VITE_APP_URL}login?email_confirmed=true`,
      },
    };
  } catch (error) {
    console.error('Error confirming email:', error);
    console.error('Error stack:', error.stack);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'An internal server error occurred',
        details: error.message
      }),
    };
  }
};
