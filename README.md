# Alumni Website

- mongo connection URL

```mongodb+srv://admin:mongo001@firstcluster.rxwyk.mongodb.net/alumni_website?retryWrites=true&w=majority```

---

- command connect from command line

``` mongo "mongodb+srv://firstcluster.rxwyk.mongodb.net/alumni_website" --username admin```

Password: mongo001

- google api

```https://console.developers.google.com/apis/dashboard```

---

# add admin user to database

use alumni_website
db.admins.insert({
    "role": "admin",
    "username": "a",
    "salt": "ddc8c2c374df06538df92e02324adc98b6e4b2f1cceebb27d1560528a187883d",
    "hash": "9858f1ef24a2e5068900b5dd966221d36a53052ce910e19f454ee7188a39325aab49614c982a4458a98985cea691fc396745df661784de6bce1ff80c60324b316878a5fe0b4e42451b7e53931f6243d95aefeb5237f57a8084253f4a416c9545cc903ee3946241348033c4331df653033cf61e1cb4b047f681ccdd6ad7184235c4c8a055a0a73dc1dac301fece753f2b63de624987335039bb816e4613d80abd6251138cbcdb07def6f18570d26371d32d45e489c5191c9eda33ae6667052231623839c196e3dd82fdff9e9c80e366a1079f42ec47e8570d7d42059595a325e26287b55e3586a16e7221d596d3de6dbfc0218471ba951dd2b4606e26d20787b3fb258c0410590a942fbfe5ae68c05ff3f0e4ea96956ec7a5a4cbb4cab0aaeb36134f15261b17ee38978f7bbec92c483c87182afb3e40f816e3b5ae37ff93ccb991b83cbfc842308f3ed1d1783f786008d258ed22c473688572580ae17d68ab385132c9ca83b8f190f94ff2be6b517f9d89476502b8a5f77830fb00b65b63214dcb1eafcd08b3f915ce9c05290cdb6529104063d63eb6572280f9678f2d1afe9a8ab18dfaa7abcfc9b92c659b5452d642f83c4b796f3b398efc0ce984db10812e5a71644fc08d71b6851adfda8cae698fccfaea2537c7f170fdbf3f44effa91906a219e8af55183ca8b0d1a5c01e2b595279b6bb3822e39687262c2eb1c1d00de"
})

## **NOTES**
- ~~check that after expiration of session records gets removed or not~~
- ~~check that is it requied to add "maxAge" to cookies~~
- may be use babel
- may be use webpack
- check browser support for things likr "forEach" loop
- make cookies http only
- custom error handler
- Cookie pop up



- comapre the project with some advanced projects (like https://github.com/sahat/hackathon-starter)
- [advanced goals-1](https://expressjs.com/en/advanced/best-practice-performance.html)
- [advanced goals-2](https://www.sitepoint.com/10-tips-make-node-js-web-app-faster/)

## IMP
- environment variables: port, ip, google client id & secret, database secret
- add npm scrpits
- change titles and links of views
- user specific middlewares.isLoggedIn middleware
- mongoose operatins without geting updated data
- sanitize / validate form data
- ajax calls for forms
- email, first name, last name validation
<!-- - "Sort operation used more than the maximum 33554432 bytes of RAM. Add an index, or specify a smaller limit." (create indexes for collection is a option) -->
- compatibility on all browsers


## PRODUCTION CAHNGES
- mongo url
- google oauth strategy redirect url
- env ip
- env port
- try to use cdns of scripts/ stylesheets
- multer ==> In case you need to handle a text-only multipart form, you should use the .none() method
- ask about max file size 




/////////////
- improve profile & public profile page
- improve communicate page with icons
- improve chat page