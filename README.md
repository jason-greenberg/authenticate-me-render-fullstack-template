# Authenticate Me Render.com Template
A Node.js Express API template with client-side JWT Token authentication out of the box. It comes equipped with features such as sign up, login, logout, and the ability to restore users from their JWT token.
## **Tech Stack**
- React
- Redux
- Node.js
- Express
- Sequelize
- PostgreSQL
## **Prerequisites**
Before you begin, you will need to implement the following environmental variables using a .env file or Render.com's built-in Environmental Variables tab:
```java
DATABASE_URL
JWT_EXPIRES_IN
JWT_SECRET
NODE_ENV //(eg. production or development)
SCHEMA // (for the database config, eg. 'airbnb_data')
```
## **Build**
To install and build the front and backend, run the following command:
```bash
npm install &&
npm run render-postbuild &&
npm run build &&
npm run sequelize --prefix backend db:migrate &&
npm run sequelize --prefix backend db:seed:all
```
The API comes seeded with 3 demo users for testing purposes. The build command will migrate the Users table and seed it with these 3 users.
## **Start**
To start the application, run the following command:
```bash
npm start
```
# **Frontend**
<!-- ![landing-page](./backend/assets/landing-page.png) -->

In our frontend, we handle user login, signup, and logout using Thunk actions.

## Login:

- A user inputs their credential and password in the login form.
- The login Thunk action is called, sending a POST request with the user information to the server.
- If the response is successful, the Thunk dispatches the setUser action to update the user in the store.

![login-form](./backend/assets/login-form.png)


## Signup:

- A user inputs their information in the signup form.
- The signup Thunk action is called, sending a POST request with the user information to the server.
- If the response is successful, the Thunk dispatches the setUser action to add the new user to the store.

![signup-form](./backend/assets/signup-form.png)

## Logout:

- The user clicks the logout button.
- The logout Thunk action is called, sending a DELETE request to the server.
- If the response is successful, the Thunk dispatches the removeUser action to remove the user from the store.

![logout](./backend/assets/logout.png)

## Restore User:

Additionally, there's a restoreUser Thunk action that sends a GET request to the server to restore the user if they're already logged in. And a loginDemoUser Thunk that logs in a demo user for testing purposes.

These actions update the sessionReducer which manages the state of the user in the Redux store.

# **Backend**
## **Login**
A user can log in by providing either a username or email and a password. The User.login function accepts the credentials and password and queries the database to find the user who matches either the username or the email. If a user is found, the password is validated using bcrypt's compareSync method. If the passwords match, the current user is returned.
```javascript
  // Code snippet for the login function
User.login = async (credentials, password) => {
  let user = await User.findOne({
    where: {
      [Op.or]: [{username: credentials}, {email: credentials}]
    }
  });
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  let isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid login credentials');
  }
  return user;
};
```
## **Sign up**
A user can sign up by providing first name, last name, username, email, and password. The User.signup function accepts these values, hashes the password using bcrypt's hashSync, and creates a new user in the database.
```javascript
// Code snippet for the signup function
User.signup = async ({ firstName, lastName, username, email, password }) => {
  const hashedPassword = bcrypt.hashSync(password);
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    hashedPassword
  });
  return await User.scope('currentUser').findByPk(user.id);
}
```
## **Authentication**
When a user logs in or signs up, a JWT token is generated, signed with the secret from the jwtConfig, and added to the cookie. The token contains the user's id and other details. To restore the session user for subsequent requests, the restoreUser function extracts the token from the cookie, verifies it with the secret, and sets the req.user object with the user details.
```js
// Sends a JWT Cookie
const setTokenCookie = (res, user) => {
  // Create the token.
  const token = jwt.sign(
    { data: user.toSafeObject() },
    secret,
    { expiresIn: parseInt(expiresIn) } // 604,800 seconds = 1 week
  );
  const isProduction = process.env.NODE_ENV === "production";
  // Set the token cookie
  res.cookie('token', token, {
    maxAge: expiresIn * 1000, // maxAge in milliseconds
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction && "Lax"
  });
  return token;
};
```
```js
// Restore the session user based on the contents of the JWT cookie.
const restoreUser = (req, res, next) => {
  // token parsed from cookies
  const { token } = req.cookies;
  req.user = null;
  return jwt.verify(token, secret, null, async (err, jwtPayload) => {
    if (err) {
      return next();
    }
    try {
      const { id } = jwtPayload.data;
      req.user = await User.scope('currentUser').findByPk(id);
    } catch (e) {
      res.clearCookie('token');
      return next();
    }
    if (!req.user) res.clearCookie('token');
    return next();
  });
};
```
## **Authorization**
The requireAuth function checks if the req.user object exists, meaning that the user has already been authenticated. If the user is not authenticated, a new error is created with a 401 status code, indicating unauthorized access. You can add this function as middleware to any endpoint requiring an authorized user.
```js
// If there is no current user, return an error
const requireAuth = function (req, _res, next) {
  if (req.user) return next();
  const err = new Error('Authentication required');
  err.title = 'Authentication required';
  err.errors = ['Authentication required'];
  err.status = 401;
  return next(err);
}
```
## **Data Validation**
The code uses the express-validator library to validate user input. The library provides several validation methods to check the presence and validity of inputs such as email, length, and username format.
For sign-up, there are multiple validation checks to ensure that the user provides a first name, last name, valid email, username of at least 4 characters, and password of at least 6 characters. The validation checks are added to the validateSignup middleware array, which is passed as an argument to the post route for signing up.
For log-in, there are validation checks for the presence of a credential (either email or username) and password. The validation checks are added to the validateLogin middleware array, which is passed as an argument to the post route for logging in.
The handleValidationErrors middleware is called at the end of both arrays to handle any validation errors that may occur. If there are errors, the next middleware in the chain is not executed, and the user is instead returned an error response.
Here is an example of the validation checks in code:
```js
// Sign up
router.post(
  '/',
  validateSignup, // middleware to validate request
  async (req, res) => {
    const { firstName, lastName, email, password, username } = req.body;
...
// Log in
router.post(
  '/',
  validateLogin, // middleware to validate request
  async (req, res, next) => {
    const { credential, password } = req.body;
...
const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Please provide a valid email or username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a password.'),
  handleValidationErrors // middleware to handle validation errors
];
const validateSignup = [
  check('firstName')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a first name'),
  check('lastName')
    .exists({ checkFalsy: true})
    .withMessage('Please provide a last name'),
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors // middleware to handle validation errors
];
```
## **Database**
The code uses the Sequelize ORM to interact with a relational database, such as MySQL or PostgreSQL, and manage the users' data. The ORM abstracts away the underlying SQL operations, allowing for easier and more concise management of data in the database, as well as providing advanced features like data validation and migrations. In this implementation, Sequelize is used to define the user model, perform CRUD operations on user data, and query the database for the user details.
