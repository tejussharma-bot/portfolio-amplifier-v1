const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { cleanEnvValue, hasConfiguredCredentials } = require("../utils/config");
const {
  buildOAuthRedirectUri,
  getConfiguredPublicAppOrigin
} = require("../utils/url-helpers");

function configurePassport() {
  const googleClientId = cleanEnvValue(process.env.GOOGLE_CLIENT_ID);
  const googleClientSecret = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET);
  const googleCallbackUrl =
    cleanEnvValue(process.env.GOOGLE_REDIRECT_URI) ||
    cleanEnvValue(process.env.GOOGLE_CALLBACK_URL) ||
    new URL("/api/auth/google/callback", getConfiguredPublicAppOrigin()).toString();

  if (
    !hasConfiguredCredentials(
      googleClientId,
      googleClientSecret
    )
  ) {
    return;
  }

  if (passport._strategies.google) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl
      },
      async (_, __, profile, done) => {
        done(null, {
          googleId: profile.id,
          email: profile.emails?.[0]?.value,
          fullName: profile.displayName
        });
      }
    )
  );
}

module.exports = {
  configurePassport
};
