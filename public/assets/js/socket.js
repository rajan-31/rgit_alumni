let chats ;
let selectedUser;

$( document ).ready( () => {
    const URL = "" // "http://localhost:8080";

    const socket = io(URL, { autoConnect: false});
    // connection
    socket.connect();

    // retrive chats
    socket.on("my chats", (myChats, unread) => {

        // if statement because on server restart chats user will be added again
        if($("#user-pane").children().length == 0) {
            chats = myChats;
            for(let i=0; i<myChats.length; i++) {
                const user = myChats[i];
                if(unread && unread.includes(user.userid)) {
                    $("#user-pane").append(`
                    <div data-userid=${user.userid} class="select-box d-flex">
                        <div class="fas fa-user my-auto user-pane-img"></div>
                        <div class="select-box-username">&nbsp;${user.username}</div>
                        <div class="fas fa-envelope notify text-success ml-auto my-auto"></div>
                    </div>
                    `);
                } else {
                    $("#user-pane").append(`
                    <div data-userid=${user.userid} class="select-box d-flex">
                        <div class="fas fa-user my-auto user-pane-img"></div>
                        <div class="select-box-username">&nbsp;${user.username}</div>
                        <div class="notify text-success ml-auto"></div>
                    </div>
                    `);
                }
            }
            addClickListenerToUserList();
        }
    });
    
    // listen to all events for development purpose
    socket.onAny((event, ...args) => {
        console.log("Listening all =>", event, args);
    });
    
    // handle connection err
    socket.on("connect_error", (err) => {
        console.log(err);
        console.log("CONNECTION eRRor!!!!")
    });

    socket.on("private message", ({ content, from }) => {
        let i;
        for(i = 0; i< chats.length; i++) {
            const user = chats[i];
            if (user.userid == from.userid) {
                // push msg to appropriate user
                chats[i].messages.push({ who: 1, msg: content});

                if(from.userid == selectedUser) {
                    $("#message-pane").append(`
                        <div class="message-rec d-flex flex-row">
                            <span class="left-triangle"></span>
                            <span class="message">${content}</span>
                        </djv>
                    `);
                } else {
                    // add icon to user with msg if it's not current user we are chatting
                    $("div .select-box[data-userid=" + user.userid +"]").children(".notify").addClass("fas fa-envelope my-auto");
                }

                break;
            }
        }

        // user not in chats
        if(i==chats.length) {
            chats.push({
                userid: from.userid,
                username: from.username,
                messages: [{ who:1, msg: content}]
            });
            $("#user-pane").append(`
                <div data-userid=${from.userid} class="select-box d-flex">
                    <div class="fas fa-user my-auto user-pane-img"></div>
                    <div>&nbsp;${from.username}</div>
                    <div class="fas fa-envelope notify text-success ml-auto my-auto"></div>
                </div>
            `);

            addClickListenerToUserList();
        }
    });

    // UI handlers
    $("#send-btn").click(() => {
        const send_to = $(".selected-box").attr("data-userid");
        const send_msg = $("#send-message").val();
        if(send_to && send_msg) {
            socket.emit("private message", {
                content: send_msg,
                to: send_to
            });
            $("#send-message").val("");

            // append new message in ui & array of msgs
            for(i = 0; i< chats.length; i++) {
                const user = chats[i];
                if (user.userid == send_to) {
                    // push msg to appropriate user
                    chats[i].messages.push({who: 0, msg:send_msg});

                    break;
                }
            }

            $messages=$("#message-pane");
            $messages.append(`
                <div class="message-sent d-flex flex-row-reverse">
                    <span class="right-triangle"></span>
                    <span class="message">${send_msg}</span>
                </div>
            `);

            scrollSmoothToBottom("message-pane");
        }
    });

    function addClickListenerToUserList() {
    
        $( ".select-box" ).click(function() {
            $('#user-pane').hide();
            $('#chat-pane').show();
    
            $( ".select-box" ).removeClass( "selected-box" );
            $this = $( this );
            $this.addClass( "selected-box" );
            selectedUser = $this.attr("data-userid");
            socket.emit("removeUnread", selectedUser);
    
            // remove notify icon
            $this.children(".notify").removeClass("fas fa-envelope my-auto");
    
            // show selected user at top of chat
            $("#selcted-user-details").removeAttr("hidden");
            $("#message-pane").removeAttr("hidden");
            $("#type-pane").removeClass("d-none").addClass("d-flex");
    
            const selectedUser_username = $this.children(".select-box-username").text();
            $("#chat-username").text(selectedUser_username);
    
            const selectedUser_userid = $this.attr('data-userid');
            $("#chat-username-link").attr('href', `/profile/${selectedUser_userid}`)
    
    
            // show messages
            $messages=$("#message-pane");
            $messages.html("");
            for(let i=0; i<chats.length; i++) {
                const user = chats[i];
                if(user.userid==selectedUser && user.messages){
                    for(let j=0; j<user.messages.length; j++) {
                        if(user.messages[j].who==1){
                            $messages.append(`
                                <div class="message-rec d-flex flex-row">
                                    <span class="left-triangle"></span>
                                    <span class="message">${user.messages[j].msg}</span>
                                </djv>
                            `);
                        }
                        else
                            $messages.append(`
                                <div class="message-sent d-flex flex-row-reverse">
                                    <span class="right-triangle"></span>
                                    <span class="message">${user.messages[j].msg}</span>
                                </div>
                            `);
                    }
    
                    break;
                }        
            }
    
            scrollToBottom("message-pane");
        });
    
    }

    $('#chat-pane').hide();
    $('.back-to-top .fa-arrow-up').hide();
});