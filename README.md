# APSIT's Alumni Website

This is the source code repository for APSIT alumni website. The website is currently in pre-production state.

### Install dependencies

`npm install`

### Set Environment variables

- Rename `.env.sample` to `.env`
- Put all values in `.env`

Note: If running first time, then set `CREATE_TEST_ADMIN`=true and also set username and password

### Start Server

`npm start`

### What now?

Test if evrything is working
- Google SignUp/SignIn, Normal SignUp/SignIn
- Reset Password
- Admin Dashbord
- Chat
- Home Page contact form

> Take a look at `Prod.md` file, for production related changes or guidelines. Even though it was written long time ago it has some important points.

---

### Development Notes

If you want to do any changes in frontend sripts or stylesheets

- They are in `./src/assets`
- For doing changes one time run `npm run gulp-compile`
- If you are going to do multiple changes, then to automate this, run `npm run gulp-watch`

Note: this is needed, because we are serving minified files, which are in `./public`