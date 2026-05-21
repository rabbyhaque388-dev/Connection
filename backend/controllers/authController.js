import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  sendRefreshTokenCookie
} from '../utils/jwt.js';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, name, age, gender, preference, bio, interests, location } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user record
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      age,
      gender,
      preference,
      bio: bio || '',
      interests: interests || [],
      location: location || ''
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Attach refresh token cookie
    sendRefreshTokenCookie(res, refreshToken);

    // Return profile & access token (exclude password)
    const userResponse = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      user: userResponse,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Retrieve user and explicitly include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Validate password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Attach refresh token cookie
    sendRefreshTokenCookie(res, refreshToken);

    // Fetch user without password field
    const userResponse = await User.findById(user._id);

    res.status(200).json({
      success: true,
      user: userResponse,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = async (req, res, next) => {
  try {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      expires: new Date(0),
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token using refresh cookie
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token missing'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Generate new short-lived access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Refresh token invalid or expired'
    });
  }
};

/**
 * @desc    Get currently logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user has already been set by protectRoute middleware (excluding password)
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate with Firebase ID Token (Google Sign-In)
 * @route   POST /api/auth/firebase
 * @access  Public
 */
export const firebaseLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID Token is required'
      });
    }

    let email, name, picture;

    // Check if Firebase Admin is initialized with real credentials
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        email = decodedToken.email;
        name = decodedToken.name || email.split('@')[0];
        picture = decodedToken.picture;
      } catch (err) {
        console.error('Firebase token verification error:', err.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid Firebase ID Token: ' + err.message
        });
      }
    } else {
      // ───────────────────────────────────────────────────────────────
      // SIMULATED SANDBOX MODE: works without Firebase credentials
      // Frontend sends a JSON-stringified mock token for local dev
      // ───────────────────────────────────────────────────────────────
      console.log('[Firebase] Sandbox mode: simulating token verification...');
      try {
        if (idToken.startsWith('{')) {
          const parsed = JSON.parse(idToken);
          email = parsed.email || 'alex@example.com';
          name = parsed.name || email.split('@')[0];
          picture = parsed.picture;
        } else if (idToken.split('.').length === 3) {
          // It looks like a real JWT token; decode the payload signature-free
          const payloadPart = idToken.split('.')[1];
          // Support standard base64 and base64url padding conversion
          const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
          const decodedString = Buffer.from(base64, 'base64').toString('utf8');
          const parsedPayload = JSON.parse(decodedString);
          
          email = parsedPayload.email || 'alex@example.com';
          name = parsedPayload.name || email.split('@')[0];
          picture = parsedPayload.picture;
        } else {
          email = idToken.includes('@') ? idToken : 'alex@example.com';
          name = email.split('@')[0];
        }
      } catch (e) {
        console.error('[Firebase Sandbox Error] Failed to decode token:', e.message);
        email = 'alex@example.com';
        name = 'Alex';
      }
    }

    const { name: reqName, age, gender, preference, bio, location, interests } = req.body;

    // Find existing user or register them automatically
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register: generate a secure random password since Google/Firebase users won't use password login directly
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        email,
        password: hashedPassword,
        name: reqName || name || email.split('@')[0],
        age: age ? parseInt(age, 10) : 18,
        gender: gender || 'other',
        preference: preference || 'both',
        bio: bio || "Hey! I joined via Firebase. Let's connect!",
        interests: interests || ['Socializing'],
        photos: picture
          ? [{ url: picture }]
          : [{ url: 'https://placehold.co/600x600/png?text=' + encodeURIComponent(reqName || name || 'User') }],
        location: location || 'Not specified'
      });
    }

    // Issue standard MERN JWT tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    sendRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      user,
      accessToken
    });
  } catch (error) {
    next(error);
  }
};
