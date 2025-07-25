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
    console.log('Attempting to confirm email for user ID:', user.id);
    const updatedUser = await dbHelpers.confirmUserEmail(user.id);

    if (!updatedUser || !updatedUser.email_confirmed) {
      console.error('Failed to update user email confirmation status.');
      // Optional: Redirect to an error page
      return {
        statusCode: 302,
        headers: {
          Location: `${process.env.VITE_APP_URL}/email-confirmation-failed`,
        },
      };
    }

    console.log('Email confirmation successful for user ID:', user.id);
    console.log('User status after update:', {
      id: updatedUser.id,
      email_confirmed: updatedUser.email_confirmed,
    });

    return {
      statusCode: 302,
      headers: {
        Location: `${process.env.VITE_APP_URL}/email-confirmed`,
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
