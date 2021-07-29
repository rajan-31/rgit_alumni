**Note:** *This file is only for development purpose*

# Alumni Website

- mongo connection URL

```mongodb+srv://<username>:<password>@firstcluster.rxwyk.mongodb.net/alumni_website?retryWrites=true&w=majority```

---

- command connect from command line

``` mongo "mongodb+srv://firstcluster.rxwyk.mongodb.net/alumni_website" --username <username>```

- google api

```https://console.developers.google.com/apis/dashboard```

- unblock gmail login on heroku

```https://accounts.google.com/DisplayUnlockCaptcha```

---

# add admin user to database

use alumni_website 
<!-- usename: a, password: a -->
db.admins.insert({
    "role": "admin",
    "username": "a",
    "active": true,
    "salt": "ddc8c2c374df06538df92e02324adc98b6e4b2f1cceebb27d1560528a187883d",
    "hash": "9858f1ef24a2e5068900b5dd966221d36a53052ce910e19f454ee7188a39325aab49614c982a4458a98985cea691fc396745df661784de6bce1ff80c60324b316878a5fe0b4e42451b7e53931f6243d95aefeb5237f57a8084253f4a416c9545cc903ee3946241348033c4331df653033cf61e1cb4b047f681ccdd6ad7184235c4c8a055a0a73dc1dac301fece753f2b63de624987335039bb816e4613d80abd6251138cbcdb07def6f18570d26371d32d45e489c5191c9eda33ae6667052231623839c196e3dd82fdff9e9c80e366a1079f42ec47e8570d7d42059595a325e26287b55e3586a16e7221d596d3de6dbfc0218471ba951dd2b4606e26d20787b3fb258c0410590a942fbfe5ae68c05ff3f0e4ea96956ec7a5a4cbb4cab0aaeb36134f15261b17ee38978f7bbec92c483c87182afb3e40f816e3b5ae37ff93ccb991b83cbfc842308f3ed1d1783f786008d258ed22c473688572580ae17d68ab385132c9ca83b8f190f94ff2be6b517f9d89476502b8a5f77830fb00b65b63214dcb1eafcd08b3f915ce9c05290cdb6529104063d63eb6572280f9678f2d1afe9a8ab18dfaa7abcfc9b92c659b5452d642f83c4b796f3b398efc0ce984db10812e5a71644fc08d71b6851adfda8cae698fccfaea2537c7f170fdbf3f44effa91906a219e8af55183ca8b0d1a5c01e2b595279b6bb3822e39687262c2eb1c1d00de"
})

## **NOTES**
- ~~check that after expiration of session records gets removed or not~~
- ~~check that is it requied to add "maxAge" to cookies~~
- ~~may be use babel~~
- ~~may be use webpack~~
- ~~check browser support for things likr "forEach" loop~~
- ~~make cookies http only~~
- custom error handler
- ~~Cookie pop up = Hey! Just letting you know that we use cookies to ensure you have the best experience possible on Devfolio. For more information, please read our privacy policy.~~



- comapre the project with some advanced projects (like https://github.com/sahat/hackathon-starter)
- [advanced goals-1](https://expressjs.com/en/advanced/best-practice-performance.html)
- [advanced goals-2](https://www.sitepoint.com/10-tips-make-node-js-web-app-faster/)

## IMP
- ~~environment variables: port, ip, google client id & secret, database secret~~
- ~~add npm scrpits~~
- ~~change titles and links of views~~
- ~~user specific middlewares.isLoggedIn middleware~~
- ~~mongoose operatins without geting updated data~~
- ~~sanitize / validate form data~~
- //ajax calls for forms
- ~~email, first name, last name validation~~
- ~~"Sort operation used more than the maximum 33554432 bytes of RAM. Add an index, or specify a smaller limit." (create indexes for collection is a option)~~
- compatibility on all browsers


## PRODUCTION CHANGES
- process manager
- change connectsrc to real domain in helmet content security policy (app.js)
- activation code URL (it's localhost currently)
- mail templates
- mongo url
- google oauth strategy redirect url
- env ip
- env port
- ~~try to use cdns of scripts/ stylesheets~~
- //multer ==> In case you need to handle a text-only multipart form, you should use the .none() method
- ask about max file size 
- set maxage for static content



/////////////
- ~~account activation~~ => https://medium.com/@mayumi8713917/sending-activation-code-by-email-with-node-js-42646f260674

- ~~improve profile & public profile page~~
- ~~improve communicate page with icons~~
- ~~improve chat page~~

- ~~account activation mail template & check other routes' results~~

- //change render to sendFile for static templates & also remove flash
- ~~don't use lean where save is used~~

- ~~check for objectid error (profile/wrong_id)~~

- ~~admission n grad yr max options, added work visibility~~
- ~~select2~~

- ~~testimonials - admin panel, home page~~
- ~~reset password~~

- ~~thumbnail - for event~~
- ~~loader~~

- ~~limit failed logins~~

- ~~newsletter~~
- ~~firefox chat textarea~~
- ~~date pickers & month picker~~
- ~~job xp, array issue for, for present value~~

- ~~date in gmt is a problem~~

- ~~no more flash for pagination - events, news, comm~~
- ~~global vars issue~~
- ~~images not to mongo~~
- ~~edit(unlink , update) and delete route(unlink)~~
- ~~err (unlink)~~

- script to create dummy data _herokru
- ~~resize images using "sharp"~~
- ~~uninstall imagemin~~

- ~~may be onerror not needed~~

- ~~lazy loading admin panel~~

- security
- ~~helmet~~
- ~~headers~~
- env vars
- ~~clean all templates (css, js)~~
- ~~minify~~

- ~~toasts~~
- ~~login pages nav~~

- 
    css
    js
    - vendor
        contact-email-form/validate.js
        tableSorter/css/table-sorter.css
        tableSorter/js/table-sorter.js

- ~~logging~~
- ~~caching~~
        
- ~~remove all <center></center> elements~~
- ~~change password~~
- //restrict msg who opt out
- ~~when form reset clicked show old content~~
- ~~for new search clear old result html~~
- ~~show not found & failed~~

- ~~styling for description~~
- //ckeeditor how to render view only
- ~~summernote~~
- chat user photos

- ~~sanitize~~
- //newletter duplicate

- ~~show news/events remove lazy load for first~~

- ~~add modal for new chat~~
- ~~change div order for sender in ui~~
- ~~change div order for rec~~
- //append to order at begin on new chat for both
- ~~change order for both on new message~~
- ~~send order on connect~~
- ~~remove from unread list only if seen... currently it's gone if refresh (not saved for online users)~~

- //chat profile image - fix image name (problem with extension)
- //ok on cookie consent
- ~~previous page & next page~~
- //whent chat link open populate it using ejs

- ~~delete chat~~
- ~~clear chat~~
- ~~show timestamp~~

- ~~ui - set online status initially retrived users~~
- //ui - ask online status of new chat
- ~~ui - handle userDisconnected emit~~
- ~~ui - handle userConnected emit~~
- ~~test https://socket.io/docs/v4/admin-ui/ on firefox~~

- //super admin
- ~~delete alumni/ student~~
------------

- ~~git filename case sensitivity err~~
    change name -> stage commit -> change name -> stage commit -> commit
    OR
    change directly on github

- use shimmer instead of loading spinner