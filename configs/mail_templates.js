let allTemplates = {};

allTemplates.home_page_mail = function(name, email, subject, message, original_name, original_user) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style type="text/css">
        .styled-table {
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 1.3em;
            font-family: sans-serif;
            min-width: 400px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
        }
        .styled-table thead tr {
            background-color: #009879;
            color: #ffffff;
            text-align: left;
        }
        .styled-table th,
        .styled-table td {
            padding: 12px 15px;
        }
        .styled-table tbody tr {
            border-bottom: 1px solid #dddddd;
        }
        .styled-table tbody tr.active-row {
            font-weight: bold;
            color: #009879;
        }
        #additional {
            padding: 10px 10px;
        }
        
        .add-head {
            font-family: sans-serif;
            font-weight: bold;
            color: #009879;
            text-decoration-line: underline;
            text-decoration-style: solid;
        }
        
        .info {
            font-family: sans-serif;
        }                                      

        </style>
    </head>
    <body>
        <table class="styled-table">
            <tbody>
                <tr>
                <td>From</td>
                <td>${name}</td>
                </tr>
                <tr class="active-row">
                <td>Email ID</td>
                <td><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                <td>Subject</td>
                <td>${subject}</td>
                </tr>
                <tr> 
                <td>Message</td>
                <td>${message}</td>
                </tr>
            </tbody>
        </table>

        <div id="additional">
            <div><span class="add-head">Additional Info</span> (Not for any use)</div>
            <div class="content">
                <div class="info">Original Sender: ${original_name}</div>
                <div class="info">Mail: ${original_user}</div>
            </div>
        </div>
    </body>
    </html>
    `
}

allTemplates.activation_mail = function(activation_link, name) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style type="text/css">
        body {
            font-family: "Muli", sans-serif;
          }
          
          .act-btn {
            display: inline-block;
            font-weight: 400;
            line-height: 1.5;
            color: #fff;
            text-align: center;
            text-decoration: none;
            vertical-align: middle;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            background-color: transparent;
            border: 1px solid transparent;
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            border-radius: 0.25rem;
            transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
              border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          }
          
          .act-primary {
            color: #fff;
            background-color: #0d6efd;
            border-color: #0d6efd;
          }
          
          .act-primary:hover {
            color: #fff;
            background-color: #0b5ed7;
            border-color: #0a58ca;
          }
          
          .name {
            color: #ffbe00;
          }
          
          .container {
            text-align:center;
          }
        </style>
    </head>
    <body>
        <div class="container">
          <h1>
              Welcome to,<br>
              <span>APSIT Alumni Family</span>
          </h1>
          <h4>Hello, <span class="name">${name}</span></h4>
          <p>Thank you for joining us!</p>
      
          <a href="${activation_link}" class="act-btn act-primary" style="color: white; ">Click to Activate Your Account</a><br><br><br>
      
          <p>If button doesn't work, use link given below.</p>
          <a href="${activation_link}" target="_blank">${activation_link}</a>
          <p>(If you didn't signup, you can ignore this mail.)</p>
        </div>
    </body>
    </html>
    `;
}

allTemplates.password_reset_mail = function (reset_link, name) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style type="text/css">
        body {
            font-family: "Muli", sans-serif;
          }
          
          .act-btn {
            display: inline-block;
            font-weight: 400;
            line-height: 1.5;
            color: #fff;
            text-align: center;
            text-decoration: none;
            vertical-align: middle;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            background-color: transparent;
            border: 1px solid transparent;
            padding: 0.375rem 0.75rem;
            font-size: 1rem;
            border-radius: 0.25rem;
            transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
              border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          }
          
          .act-primary {
            color: #fff;
            background-color: #0d6efd;
            border-color: #0d6efd;
          }
          
          .act-primary:hover {
            color: #fff;
            background-color: #0b5ed7;
            border-color: #0a58ca;
          }
          
          .name {
            color: #ffbe00;
          }

          .container {
            text-align:center;
          }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>APSIT Alumni Portal</h1>
            <h4>Hello, <span class="name">${name}</span></h4>
            <p>We have received a request to reset your password.</p>
            <a href="${reset_link}" class="act-btn act-primary" style="color: white; ">Click to Reset Your Password</a><br><br><br>
        
            <p>If button doesn't work, use link given below.</p>
            <a href="${reset_link}" target="_blank">${reset_link}</a>
            <p>(If you didn't request to reset password, you can ignore this mail.)</p>
        </div>
    </body>
    </html>
    `
}

module.exports = allTemplates;