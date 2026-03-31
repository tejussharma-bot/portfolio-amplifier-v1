const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { hasConfiguredCredentials } = require("../utils/config");

function configurePassport() {
  if (
    !hasConfiguredCredentials(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
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
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:3000/api/auth/google/callback"
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
