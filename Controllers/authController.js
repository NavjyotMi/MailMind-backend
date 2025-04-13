/**
 * Authentication Module
 *
 * This module handles Google OAuth2 authentication and account linking.
 * It provides functionality for:
 * 1. Logging in users via Google OAuth2
 * 2. Retrieving user data from Google API
 * 3. Creating and updating user records in the database
 * 4. Linking additional Google accounts to the user's profile
 *
 * Dependencies:
 * - axios: For making HTTP requests to the Google API
 * - UserSchema: Mongoose model for the User collection
 * - LinkedAccountSchema: Mongoose model for linked Google accounts
 * - redis: For managing access tokens in Redis cache
 *
 * Environment Variables:
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, etc.
 */

/**
 * Retrieves user data from the database using the authenticated email.
 *
 * @param {Object} req - The request object containing the user's email and access token.
 * @param {Object} res - The response object, which sends the user data in JSON format.
 * @throws {AppError} If the user is not found in the database.
 */

const axios = require("axios");
const redisClient = require("../Redis");
const User = require("../Schema/UserSchema");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catAsync");
const { createJwt } = require("../utils/jwtutility");
const LinkedAccount = require("../Schema/LinkedAccountSchema");
const { addAccessTokenQueue } = require("../Queues/accessTokenQueue");
const { encryptedToken, decryptedToken } = require("../utils/tokenSecurity");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
const CLIENT_REDIRECT = process.env.MAIN_ACCOUNT_REDIRECT_URI;

module.exports.LoginUser = catchAsync(async (req, res) => {
  const code = req.query.code;
  if (!code) throw new AppError(400, "The code is missing ");
  console.log("ther server is hit");

  // Exchange the code for an access token from Google's OAuth2 endpoint
  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    })
  );

  const { access_token } = data;

  // Retrieve user info from Google using the access token
  const userInfo = await axios
    .get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    )
    .catch((err) => {
      throw new AppError(500, "failed to retrieve the data from google");
    });

  const user = userInfo.data;

  // Check if the user already exists in the database
  const userExist = await User.findOne({ email: user.email });
  const refreshtoken = encryptedToken(data.refresh_token);

  if (!userExist) {
    // Create a new user if one doesn't exist
    const newUser = {
      fname: user.given_name,
      lname: user.family_name,
      email: user.email,
      refreshToken: refreshtoken,
      picture: user.picture,
    };

    await User.create(newUser);
  } else {
    // Update the existing user with new refresh token and picture
    await User.findByIdAndUpdate(userExist._id, {
      refreshToken: refreshtoken,
      picture: user.picture,
    });
  }

  // Generate a JWT for the user and set it as a cookie
  const jwt = createJwt({ email: user.email, access_token: access_token });

  res.cookie("accesstoken", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "None", // Prevent CSRF attacks
  });

  res.redirect(CLIENT_REDIRECT);
});

// Get user data from the database
module.exports.getUser = catchAsync(async (req, res) => {
  const email = req.email;
  let access_token = req.userId;
  const user = await User.findOne({ email: email }).select("-refreshToken");
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // If the user has linked accounts, add them to the access token queue
  if (user.linkedAccounts && user.linkedAccounts.length > 0) {
    for (const element of user.linkedAccounts) {
      const at = await redisClient.get(`accesstoken:${element.email}`);
      console.log("this is from the adding the email to the queue", at);
      if (!at) addAccessTokenQueue({ email: element.email });
    }
  }

  // Store the access token in Redis for future use and set its expiry
  await redisClient.set(`accesstoken:${email}`, access_token, "EX", 3600);

  res.status(200).json(user);
});

// Generate a redirect URI for adding a linked account
module.exports.addAccountRoute = catchAsync(async (req, res) => {
  const email = req.email;

  // Check if the necessary environment variables are set
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_ADDACCOUNT_REDIRECT_URI
  ) {
    throw new AppError(
      500,
      "Missing necessary Google OAuth environment variables."
    );
  }

  // Generate and send the redirect URI for Google OAuth authorization
  return res.json({
    redirecturi: `https://accounts.google.com/o/oauth2/auth?client_id=${
      process.env.GOOGLE_CLIENT_ID
    }&redirect_uri=${
      process.env.GOOGLE_ADDACCOUNT_REDIRECT_URI
    }&response_type=code&scope=email%20profile%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent&state=${encodeURIComponent(
      email
    )}`,
  });
});

// Add a linked Google account to the user's profile
module.exports.addAccount = catchAsync(async (req, res) => {
  const code = req.query.code;
  const mainEmail = req.query.state
    ? decodeURIComponent(req.query.state)
    : null;
  if (!code) return res.status(400).send("Missing auth code");
  if (!mainEmail) return res.status(400).send("Missing the main mail");

  // Exchange the code for an access token
  const { data } = await axios.post(
    "https://oauth2.googleapis.com/token",
    new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: process.env.REDIRECT_URI_ADD_ACCOUNT,
      grant_type: "authorization_code",
    })
  );

  // Retrieve user info from Google
  const userInfo = await axios
    .get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${data.access_token}`
    )
    .catch((err) => {
      throw new AppError(500, "Failed to retrieve user info from Google.");
    });

  if (!userInfo || !userInfo.data || !userInfo.data.email) {
    throw new AppError(404, "Failed to retrieve user info from Google.");
  }

  // Check if the account is already linked
  const UserExist = await LinkedAccount.findOne({
    linkedEmail: userInfo.data.email,
  });

  if (!UserExist) {
    if (!userInfo) throw new Error("user doesn't exist");

    // Add the linked account to the user's profile
    await User.findOneAndUpdate(
      { email: mainEmail },
      { $addToSet: { linkedAccounts: { email: userInfo.data.email } } }
    );

    // Create a linked account record
    const refreshToken = encryptedToken(data.refresh_token);
    const obj = {
      mainMail: mainEmail,
      linkedEmail: userInfo.data.email,
      refreshToken: refreshToken,
    };
    await LinkedAccount.create(obj);
  }

  // Retrieve the access token from Redis
  const access_token = await redisClient.get(`accesstoken:${mainEmail}`);
  if (!access_token) {
    throw new AppError(500, "Access token not found in Redis.");
  }

  // Generate a new JWT for the main user
  const jwt = createJwt({
    email: mainEmail,
    access_token: access_token,
  });

  // Set the new JWT as a cookie
  res.cookie("accesstoken", jwt, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
  return res.redirect(CLIENT_REDIRECT);
});
