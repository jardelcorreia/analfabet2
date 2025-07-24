ALTER TABLE users
ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN confirmation_token TEXT;
