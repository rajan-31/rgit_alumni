# Pre Production config

- static content maxage
- privacy policy & Terms of service
- add domains in skill (profile page)
- profile page branch
- change timestamp (not format the location) based on hosting location

# ASK

- max file size
- self mail (home page)

# External Setup

## MongoDB setup

- Install as service
- Create Users

## Process manager
- SystemD

    https://www.axllent.org/docs/nodejs-service-with-systemd/

- PM2

    https://pm2.io/

# App Setup/Config

## Get OAuth credentials
https://console.developers.google.com/apis/dashboard

## Emails

- SMTP server credentials
- nodemailer transporter senderName, Sender, noreply name
- what to do abt self mail?

# Final Config

## MongoDB URL

## Domain name changes

- helmet config (app.js)
- hlmet (other changes like ws, wss, http, https)
- activation link (index.js)
- OAuth redirect URL

## create first admin for website
`npm run createTestAdmin`
