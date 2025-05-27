import { OAuth2Client } from 'google-auth-library';
import config from '../constants/config.js';

const client = new OAuth2Client({
  clientId: config.GOOGLE_CLIENT_ID,
});

const verifyGoogleToken = async token => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      username: payload.name,
      avatarUrl: payload.picture,
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw error;
  }
};

export default verifyGoogleToken;
