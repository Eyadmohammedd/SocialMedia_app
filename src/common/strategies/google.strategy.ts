import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} from "../../config/config";

/* ===============================================
   Google OAuth 2.0 Strategy
   - Validates Google token
   - Returns a normalized user object to controller
   =============================================== */

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID as string,
      clientSecret: GOOGLE_CLIENT_SECRET as string,
      callbackURL: GOOGLE_CALLBACK_URL as string,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: any, user?: any) => void,
    ) => {
      try {
        const googleUser = {
          googleId: profile.id,
          email: profile.emails?.[0]?.value ?? "",
          firstName: profile.name?.givenName ?? "",
          lastName: profile.name?.familyName ?? "",
          profilePicture: profile.photos?.[0]?.value ?? undefined,
        };

        return done(null, googleUser);
      } catch (err) {
        return done(err, undefined);
      }
    },
  ),
);

// We use JWT — no session serialization needed
passport.serializeUser((user: any, done: (err: any, user?: any) => void) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: (err: any, user?: any) => void) => {
  done(null, user);
});
export default passport;
