import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import Strategy from 'passport-strategy';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './database.js';

export const configurePassport = () => {
    const db = getDB();

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
            if (err) return done(err);
            if (row) {
                const user = {
                    id: row.id,
                    name: row.name,
                    email: row.email,
                    role: row.role,
                    permissions: row.permissions || null,
                    tickets: JSON.parse(row.tickets || '[]'),
                    currency: row.currency || 'XAF'
                };
                done(null, user);
            } else {
                done(null, null);
            }
        });
    });

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: CALLBACK_URL
            },
            (accessToken, refreshToken, profile, done) => {
                const googleEmail = profile.emails && profile.emails[0] && profile.emails[0].value 
                                   ? profile.emails[0].value.toLowerCase().trim() 
                                   : '';
                const googleId = profile.id;
                const displayName = profile.displayName;

                // 1. Try to find user by google_id
                db.get(`SELECT * FROM users WHERE google_id = ?`, [googleId], (err, userByGid) => {
                    if (err) return done(err);

                    if (userByGid) {
                        return done(null, { ...userByGid, tickets: JSON.parse(userByGid.tickets || '[]') });
                    }

                    // 2. If not found, try to find by email
                    db.get(`SELECT * FROM users WHERE email = ?`, [googleEmail], (err, userByEmail) => {
                        if (err) return done(err);

                        if (userByEmail) {
                            // Link Google account to existing manual account
                            db.run(`UPDATE users SET google_id = ? WHERE id = ?`, [googleId, userByEmail.id], (err) => {
                                if (err) console.error('Error linking Google ID:', err);
                                return done(null, { ...userByEmail, google_id: googleId, tickets: JSON.parse(userByEmail.tickets || '[]') });
                            });
                        } else {
                            // 3. Create a brand new user
                            const newUser = {
                                id: uuidv4(),
                                name: displayName,
                                email: googleEmail,
                                role: 'attendee',
                                google_id: googleId,
                                tickets: '[]'
                            };
                            db.run(`INSERT INTO users (id, name, email, role, tickets, google_id) VALUES (?, ?, ?, ?, ?, ?)`,
                                [newUser.id, newUser.name, newUser.email, newUser.role, newUser.tickets, newUser.google_id], (err) => {
                                    if (err) return done(err);
                                    return done(null, { ...newUser, tickets: [] });
                                });
                        }
                    });
                });
            }
        ));
    } else {
        console.warn('Google OAuth not configured. Using mock auth.');
        // Mock strategy for development
        passport.use('mock', new (class extends Strategy {
            authenticate() {
                const mockUser = {
                    id: 'test123', // Matches our default DB user
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'organizer',
                    tickets: []
                };
                this.success(mockUser);
            }
        })());
    }
    
    return passport;
};
