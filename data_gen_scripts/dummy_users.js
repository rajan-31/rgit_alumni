for(let i=0; i<25; i++) {
    User.register(new User(
        {
            firstName: `Test${i}`, 
            lastName: `User${i}`, 
            username: `Test${i}.User${i}@some.com`, 
            userType: "alumni",
            receiveMsg: true,
            active: true,
            profileImage: `/images/users/profileImage- (${i+1}).jpg`,
            profile: {
                bio: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
            }

        }), "111111", function(err, user){
            console.log(user.firstName);
    });
}