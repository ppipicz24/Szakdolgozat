const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  '703248656309-bg1if901c8kcac28o0b5vvok078351vq.apps.googleusercontent.com',
  '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',
  'http://localhost:3000/google/auth/google/callback'
);

module.exports = oAuth2Client;