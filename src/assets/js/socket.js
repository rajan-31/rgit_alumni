let chats = [] ;
let selectedUser;
let todaysDate = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
let dateMap = new Map();
let statusMap = new Map()

$( document ).ready( function() {
    function scrollToBottom (id) {
        var div = document.getElementById(id);
        div.scrollTop = div.scrollHeight - div.clientHeight;
    }
    
    function scrollSmoothToBottom (id) {
        var div = document.getElementById(id);
        $('#' + id).animate({
           scrollTop: div.scrollHeight - div.clientHeight
        }, 500);
    }

    // const URL = "" // "http://localhost:8080";

    const socket = io({ autoConnect: false});
    // connection
    socket.connect();

    // retrive chats
    socket.on("my chats", (myChats, unread, order, onlineUsers) => {
        // if statement because on server restart chats user will be added again
        if($("#user-pane").children().length == 0 && order.length>0) {
            chats = myChats;

            // map chats by userid
            let orderMap = new Map();
            for(let i=0; i<myChats.length; i++) {
                orderMap[myChats[i].userid]=myChats[i];
            }

            // count unread msg
            // let msgCount = {};
            // unread.forEach(function (x) { msgCount[x] = (msgCount[x] || 0) + 1; });

            // console.log(msgCount);

            // remove duplicates from array
            unread = [...new Set(unread)];


            for (let i = 0; i < order.length; i++) {
                const user = orderMap[order[i]];
                // console.log(msgCount[user.userid]);

                if(onlineUsers && onlineUsers.includes(user.userid)) {
                    if (unread && unread.includes(user.userid)) {
                        $("#user-pane").append(`
                        <div data-userid=${user.userid} class="select-box d-flex">
                            <div class="status user-online my-auto px-1"><i class="fas fa-circle"></i></div>
                            <div class="fas fa-user my-auto user-pane-img"></div>
                            <div class="select-box-username my-auto">&nbsp;${user.username}</div>
                            <div class="fas fa-envelope notify text-success ml-auto my-auto"></div>
                        </div>
                        `);
                    } else {
                        $("#user-pane").append(`
                        <div data-userid=${user.userid} class="select-box d-flex">
                            <div class="status user-online my-auto px-1"><i class="fas fa-circle"></i></div>
                            <div class="fas fa-user my-auto user-pane-img"></div>
                            <div class="select-box-username my-auto">&nbsp;${user.username}</div>
                            <div class="notify text-success ml-auto"></div>
                        </div>
                        `);
                    }
                } else {
                    if (unread && unread.includes(user.userid)) {
                        $("#user-pane").append(`
                        <div data-userid=${user.userid} class="select-box d-flex">
                            <div class="status user-offline my-auto px-1"><i class="fas fa-circle"></i></div>
                            <div class="fas fa-user my-auto user-pane-img"></div>
                            <div class="select-box-username my-auto">&nbsp;${user.username}</div>
                            <div class="fas fa-envelope notify text-success ml-auto my-auto"></div>
                        </div>
                        `);
                    } else {
                        $("#user-pane").append(`
                        <div data-userid=${user.userid} class="select-box d-flex">
                            <div class="status user-offline my-auto px-1"><i class="fas fa-circle"></i></div>
                            <div class="fas fa-user my-auto user-pane-img"></div>
                            <div class="select-box-username my-auto">&nbsp;${user.username}</div>
                            <div class="notify text-success ml-auto"></div>
                        </div>
                        `);
                    }
                }
            }
            addClickListenerToUserList();

            for(let i=0; i< onlineUsers.length; i++) {
                statusMap.set(String(onlineUsers[i]), true);
            }
        }
    });
    
    // listen to all events for development purpose
    // socket.onAny((event, ...args) => {
    //     console.log("Listening all =>", event, args);
    // });
    
    // handle connection err
    let alert_count = 0;
    socket.on("connect_error", (err) => {
        // console.log(err);
        if(alert_count<=0) {
            alert_count+=1;
            alert("Lost chat server connection!")
        }
    });

    socket.on("private message", ({ content, from, timestamp }) => {
        let i;
        for(i = 0; i< chats.length; i++) {
            const user = chats[i];
            if (user.userid == from.userid) {
                // push msg to appropriate user
                chats[i].messages.push({ who: 1, msg: content, timestamp: timestamp});
                timestamp = timestamp.split(", ");

                const timestamp_date = timestamp[0];
                const timestamp_time = timestamp[1];

                todaysDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }).split(", ")[0];

                const $messages = $("#message-pane");

                if (!dateMap.has(timestamp_date)) {
                    if (timestamp_date == todaysDate) {
                        $messages.append(`
                            <div class="date-line">
                                <span class="date-line-date">today</span>
                            </div>
                        `);
                    } else {
                        $messages.append(`
                            <div class="date-line">
                                <span class="date-line-date">yesterday</span>
                            </div>
                        `);
                    }

                    dateMap.set(timestamp_date, 1);
                }

                let $this = $("div .select-box[data-userid=" + user.userid + "]");
                $this.children(".status").addClass("user-online").removeClass("user-offline");
                statusMap.set(String(user.userid), true);

                if(from.userid == selectedUser) {
                    $messages.append(`
                        <div class="message-rec d-flex flex-row">
                            <span class="left-triangle"></span>
                            <span class="message">${content}<span class="msg-ts">${timestamp_time}</span></span>
                        </div>
                    `);

                    $this.parent().prepend($this);
                } else {
                    // add icon to user with msg if it's not current user we are chatting
                    

                    $this.children(".notify").addClass("fas fa-envelope my-auto");

                    // add to unread list
                    socket.emit("addUnread", user.userid);

                    $this.parent().prepend($this);
                }

                break;
            }
        }

        // user not in chats
        if(i==chats.length) {
            chats.push({
                userid: from.userid,
                username: from.username,
                messages: [{ who: 1, msg: content, timestamp: timestamp}]
            });
            $("#user-pane").prepend(`
                <div data-userid=${from.userid} class="select-box d-flex">
                    <div class="status user-online my-auto px-1"><i class="fas fa-circle"></i></div>
                    <div class="fas fa-user my-auto user-pane-img"></div>
                    <div class="select-box-username my-auto">&nbsp;${from.username}</div>
                    <div class="fas fa-envelope notify text-success ml-auto my-auto"></div>
                </div>
            `);

            addClickListenerToUserList();
            statusMap.set(String(from.userid), true);
        }
    });

    // handle newly connected user
    socket.on("userConnected", (userid) => {
        if (userid == selectedUser) {
            $("#chat-user-status").text("online");
        }

        let $this = $("div .select-box[data-userid=" + userid + "]");
        if($this.length>0) {
            $this.children(".status").addClass("user-online").removeClass("user-offline");
            statusMap.set(userid, true);
        }
        
    });
    
    // handle offline users
    socket.on("userDisconnected", (userid) => {
        if (userid == selectedUser) {
            $("#chat-user-status").text("offline");
        }

        let $this = $("div .select-box[data-userid=" + userid + "]");
        if($this.length>0) {
            $this.children(".status").addClass("user-offline").removeClass("user-online");
            statusMap.set(userid, false);
        }
        
    });

    

    // UI handlers
    $("#send-btn").click(() => {
        const send_to = $(".selected-box").attr("data-userid");
        const send_msg = $("#send-message").val();

        const temp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }).split(", ");
        const timestamp_date = temp[0];
        const timestamp_time = temp[1].slice(0, -6) + " " + temp[1].slice(-2);

        const timestamp = timestamp_date + ", " + timestamp_time;
        
        if(send_to && send_msg) {
            socket.emit("private message", {
                content: send_msg,
                to: send_to,
                timestamp
            });
            $("#send-message").val("");

            // append new message in ui & array of msgs
            for(let i = 0; i< chats.length; i++) {
                const user = chats[i];
                if (user.userid == send_to) {
                    // push msg to appropriate user
                    chats[i].messages.push({who: 0, msg:send_msg, timestamp: timestamp});

                    // push chat to top
                    let $this = $("div .select-box[data-userid=" + user.userid + "]");
                    $this.parent().prepend($this);

                    break;
                }
            }

            let $messages=$("#message-pane");

            todaysDate = timestamp_date;

            if (!dateMap.has(timestamp_date)) {
                $messages.append(`
                    <div class="date-line">
                        <span class="date-line-date">today</span>
                    </div>
                `);

                dateMap.set(timestamp_date, 1);
            }

            $messages.append(`
                <div class="message-sent d-flex flex-row-reverse">
                    <span class="right-triangle"></span>
                    <span class="message">${send_msg}<span class="msg-ts">${timestamp_time}</span></span>
                </div>
            `);

            scrollSmoothToBottom("message-pane");
        }
    });

    function addClickListenerToUserList() {        
        $( ".select-box" ).click(function() {
            $('#chat-pane').show('slow');
            $('#utils-pane').hide('slow');
    
            $( ".select-box" ).removeClass( "selected-box" );
            const $this = $( this );
            $this.addClass( "selected-box" );
            selectedUser = $this.attr("data-userid");

            // remove from unread
            socket.emit("removeUnread", selectedUser);
    
            // remove notify icon
            $this.children(".notify").removeClass("fas fa-envelope my-auto");
    
            // show selected user at top of chat
            $("#selcted-user-details").removeAttr("hidden");
            $("#message-pane").removeAttr("hidden");
            $("#type-pane").removeClass("d-none").addClass("d-flex");
    
            const selectedUser_username = $this.children(".select-box-username").text();
            $("#chat-username").text(selectedUser_username);

            // set user status
            if(statusMap.get(selectedUser)) {
                $("#chat-user-status").text("online");
            } else {
                $("#chat-user-status").text("offline");
            }
    
            const selectedUser_userid = $this.attr('data-userid');
            $("#chat-username-link").attr('href', `/profile/${selectedUser_userid}`)
    
    
            // show messages
            const $messages=$("#message-pane");
            $messages.html("");

            // clear date map
            dateMap.clear();
            for(let i=0; i<chats.length; i++) {
                const user = chats[i];
                if(user.userid==selectedUser && user.messages){
                    for(let j=0; j<user.messages.length; j++) {
                        const timestamp = user.messages[j].timestamp.split(", ");

                        const timestamp_date = timestamp[0];
                        const timestamp_time = timestamp[1];

                        const _todaysDate = new Date(todaysDate);
                        const _timestamp_date = new Date(timestamp_date);

                        if (!dateMap.has(timestamp_date)) {
                            if (_todaysDate - _timestamp_date > 86400000) {
                                $messages.append(`
                                    <div class="date-line">
                                        <span class="date-line-date">${_timestamp_date.toLocaleDateString("in")}</span>
                                    </div>
                                `);
                            } else if ( _todaysDate - _timestamp_date == 86400000) {
                                $messages.append(`
                                    <div class="date-line">
                                        <span class="date-line-date">yesterday</span>
                                    </div>
                                `);
                            } else if (todaysDate == timestamp_date) {
                                $messages.append(`
                                    <div class="date-line">
                                        <span class="date-line-date">today</span>
                                    </div>
                                `);
                            }

                            dateMap.set(timestamp_date, 1);
                        } 

                        if(user.messages[j].who==1){
                            $messages.append(`
                                <div class="message-rec d-flex flex-row">
                                    <span class="left-triangle"></span>
                                    <span class="message">${user.messages[j].msg}<span class="msg-ts">${timestamp_time}</span></span>
                                </div>
                            `);
                        }
                        else
                            $messages.append(`
                                <div class="message-sent d-flex flex-row-reverse">
                                    <span class="right-triangle"></span>
                                    <span class="message">${user.messages[j].msg}<span class="msg-ts">${timestamp_time}</span></span>
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

    $('#back-btn').on('click', () => {
        selectedUser = '';
        $(".select-box").removeClass("selected-box");
        $('#utils-pane').show('slow');
        $('#chat-pane').hide('slow');
    });

    const $menu_container = $('#menu-container');
    $('#menu-btn').on("click", function() {
        $menu_container.show(50);

        $('body').on("click", function (e) {
            if ($(e.target).closest('#menu-container').length || 
                $(e.target).closest('#menu-btn').length) {
                return;
            } else {
                $menu_container.hide(50);
                $('body').off();
            }
        });

    });
    
    $('#menu-option-clear').on("click", function () {
        for (let i = 0; i < chats.length; i++) {
            if (chats[i].userid == selectedUser) {
                chats[i].messages = [];
                break;
            }
        }

        // emit event
        socket.emit("clearChat", selectedUser);

        $('#message-pane').html("");
        
        $menu_container.hide(50);
    });

    $('#menu-option-delete').on("click", function () {
        for (let i = 0; i < chats.length; i++) {
            if(chats[i].userid == selectedUser) {
                chats.splice(i, 1);
                break;
            }
        }

        // emit event
        socket.emit("deleteChat", selectedUser);

        $("div .select-box[data-userid=" + selectedUser + "]").remove();
        $('#back-btn').click();

        $menu_container.hide(50);
        $('#menu-btn').tooltip()
    });
});