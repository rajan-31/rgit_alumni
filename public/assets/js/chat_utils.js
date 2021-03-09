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

$('#back-btn').on('click', () => {
    selectedUser = '';
    $( ".select-box" ).removeClass( "selected-box" );
    $('#user-pane').show();
    $('#chat-pane').hide();
});