const axios = require("axios");
const User = require("../Schema/UserSchema");
const { encryptedToken } = require("../utils/tokenSecurity");
const { createJwt } = require("../utils/jwtutility");
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:5000/api/v1/auth/google/callback";

// Step 1: Exchange auth code for tokens
module.exports.LoginUser = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Missing auth code");
  // console.log(req.headers);
  try {
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
    // console.log(data);
    const { access_token, id_token } = data;
    // console.log(access_token);

    // Step 2: Fetch user info from Google
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`
    );

    const user = userInfo.data;
    // console.log("this is just user Info", user);

    // find if the user exists
    const userExist = await User.findOne({ email: user.email });
    // console.log(userExist);
    const refreshtoken = encryptedToken(data.refresh_token);
    // console.log("hello there");
    if (!userExist) {
      const newUser = {
        fname: user.given_name,
        lname: user.family_name,
        email: user.email,
        refreshToken: refreshtoken,
      };
      // console.log(newUser);
      // const u = await User.create(newUser);
      // console.log("User doesn't exist");
    } else {
      await User.findByIdAndUpdate(userExist._id, {
        refreshToken: refreshtoken,
      });
    }

    // console.log(u);
    const jwt = createJwt({ email: user.email });

    res.cookie("accesstoken", access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });
    // res.json({ user, id_token, jwt });
    console.log("Set-Cookie Header:", res.getHeaders()["set-cookie"]);
    res.redirect("http://localhost:5173/home");
  } catch (err) {
    console.log(err);
    console.error("Error in OAuth:", err.response?.data || err.message);
    res.status(500).send("OAuth Failed");
  }
};

module.exports.getUser = async function (req, res) {
  try {
    // console.log(req.headers);
    const access_token = req.headers.cookie;
    // console.log(access_token);
    const at = access_token.split("=")[1];
    // console.log(at);
    const userInfo = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${at}`
    );
    // console.log(userInfo.data);
    res.status(200).json(userInfo.data);
  } catch (error) {
    console.log(error);
  }
};

// if exists then update the refresh token
// if doens't exist then create one

// const emails = await axios.get(
//   "https://www.googleapis.com/gmail/v1/users/me/messages",
//   {
//     headers: { Authorization: `Bearer ${access_token}` },
//   }
// );
// const readEmail = await emails.json;
// console.log("this is email ", emails.data);
// const email = await axios.get(
//   `https://www.googleapis.com/gmail/v1/users/me/messages/1955b8e9df7ba25d`,
//   {
//     headers: { Authorization: `Bearer ${access_token}` },
//   }
// );

// console.log("Email Content:", email.data);
// Step 3: Store access_token in cookie for session management
