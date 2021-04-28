for (let i = 0; i < 15; i++) {
    User.register(new User(
        {
            "profile": {
                "workExperience": {
                    "employer": ["Accenture", "Start It Solutions Private Limited, ISAPPP , INdia", "TCS"],
                    "jobTitle": ["Jr. Software Engieneer", "Database Admin", "Sr. Software Engieneer"],
                    "jobDomain": ["Database Management", "Database Management", "DevOps"],
                    "jobFrom": ["2021-03", "2021-08", "2021-01"],
                    "jobTill": ["2021-07", "2021-05", ""]
                },
                "address": {
                    "homeAddress": {
                        "addressLine1": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
                        "country": "India",
                        "zipcode": "454007"
                    },
                    "businessAddress": {
                        "addressLine1": "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
                        "country": "Japan",
                        "zipcode": "789456"
                    }
                },
                "skills": ["Machine Learning", "DevOps"],
                "bio": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
                "gender": "male",
                "dob": "2000-02-14T18:30:00.000Z",
                "contact": {
                    "mobile": "9977122727",
                    "email": `Demo.User${i}@something.com`
                },
                "social_media": {
                    "linkedin": "https://www.linkedin.com/in/demo_user",
                    "instagram": "https://www.instagram.com/demo_user",
                    "website": ""
                },
                "yearOfAdmission": "2018",
                "yearOfGraduation": "2022",
                "branch": "IT"
            },
            "unread": [],
            "active": true,
            "firstName": "Demo",
            "lastName": `User${i}`,
            "username": `Demo.User${i}@something.com`,
            "chats": [],
            "receiveMsg": true,
            "userType": "alumni",
            "profileImage": "/images/users/profileImage-demo.jpg",
            "order": []

        }), "111111", function (err, user) {
            if (err)
                console.log(err);
            else
                console.log(user.username);
        });
}