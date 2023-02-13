const input_text = document.getElementById("input_text");
const middle_body = document.getElementById("middle_body");
const bot_modal = parent.document.getElementById("bot_modal");
let user_message = undefined

function uuid() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

if (sessionStorage.getItem('sender_id') == null) {
    sessionStorage.setItem("sender_id", uuid())
}
console.log("Chat ID:", sessionStorage.getItem('sender_id'))

input_text.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("submit_button").click();
    }
});

function display_bot_typing() {
    middle_body.innerHTML += `<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>`
    middle_body.scrollTo(0, middle_body.scrollHeight);
}

function remove_bot_typing() {
    const element = document.getElementById("botTyping");
    element.remove()
}

function send_user_message_to_backend(text) {
    fetch('/chat_body', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({'message': text, 'sender': sessionStorage.getItem('sender_id')})
    }).then(function (response) {
        return response.json()
    }).then(function (data) {
        let time_interval = 0
        for (let i = 0; i < data.length; i += 1) {
            setTimeout(() => {
                display_bot_message(data[i]);
            }, time_interval)
            time_interval += 1200;
        }
    });
}

function display_user_message(text) {
    console.log("User: ", text)
    middle_body.innerHTML += `<p class='userMsg'>${text}</p><div class='clearfix'></div>`;
    middle_body.scrollTo(0, middle_body.scrollHeight);
}

function display_bot_message(data) {
    if (data.hasOwnProperty('text') && !data.hasOwnProperty('buttons')) {
        add_bot_html_text(data.text)
    }
    if (data.hasOwnProperty('text') && data.hasOwnProperty('buttons')) {
        add_bot_html_buttons(data)
    }
    if (data.hasOwnProperty('custom')) {
        display_data_in_modal(data)
    }
    middle_body.scrollTo(0, middle_body.scrollHeight);
}

function add_bot_html_text(text) {
    display_bot_typing();
    setTimeout(() => {
        remove_bot_typing();
        console.log("Bot: ", text)
        middle_body.innerHTML += `<p class='botMsg'>${text.split('\n').join('<br>')}</p><div class='clearfix'></div>`;
        middle_body.scrollTo(0, middle_body.scrollHeight);
    }, 800)
}

function add_bot_html_buttons(data) {
    display_bot_typing();
    setTimeout(() => {
        remove_bot_typing();
        console.log("Bot: ", data.text)
        input_text.disabled = true;
        middle_body.innerHTML += `<div class='botMsg'><p>${data.text.split('\n').join('<br>')}</p><div id='bot_buttons' class='bot_msg_button'></div></div>`
        const bot_buttons = document.getElementById("bot_buttons");
        data.buttons.forEach(function (obj) {
            console.log("Buttons: ", obj.title)
            let button_class;
            if (obj["payload"] === '/affirm' || obj["payload"] === '/display_all_details' || obj["payload"] === '/display_list') {
                button_class = 'menuChips green_button'
            } else {
                button_class = 'menuChips red_button'
            }
            bot_buttons.innerHTML += `<div class='${button_class}' onclick='in_chat_button_function(this.innerText, this.getAttribute("data-payload"))' data-payload='${obj["payload"]}'>${obj.title}</div>`;
            middle_body.scrollTo(0, middle_body.scrollHeight);
        })
        middle_body.innerHTML += `<div class='clearfix'></div>`;
    }, 800)
}

function display_data_in_modal(data) {
    const modal = parent.document.getElementById("bot_modal");
    modal.style.display = "flex";
    if (user_message === '/display_list') {
        const weather_list = parent.document.getElementById("weather_list");
        for (let key in data["custom"]) {
            if (key === 'text') {
                console.log("Bot: ", data["custom"][key])
                weather_list.innerHTML += `<p><b>${data["custom"][key].split('\n').join('<br>')}</b></p><div class='bot_msg_button' id='modal_checkbox'></div>`
            } else if (key === 'details') {
                let val = data["custom"][key];
                console.log("Bot: ", data["custom"][key])
                const modal_checkbox = parent.document.getElementById("modal_checkbox");
                for (let child_key in val) {
                    modal_checkbox.innerHTML += `<div class='menu_checkbox'><input type='checkbox' id='${val[child_key]}' name='more_details'><label style='cursor: pointer;' For='${val[child_key]}'>${child_key}</label></div>`;
                }
            } else if (key === 'buttons') {
                weather_list.innerHTML += `<div class='clearfix'></div>`;
                weather_list.innerHTML += `<div id='modal_send_button' class='modal_button green_button' onclick='modal_send_onclick()'> ${data["custom"][key]} </div>`;
            }
        }
    } else {
        console.log(data)
        const all_weather_details = parent.document.getElementById("all_weather_details");
        all_weather_details.style.display = "block"
        let lat, long
        if (data["custom"]["payload"]["latitude"] > 0) {
            lat = `${data["custom"]["payload"]["latitude"]}° N, `
        } else {
            lat = `${Math.abs(data["custom"]["payload"]["latitude"])}° S, `
        }
        if (data["custom"]["payload"]["longitude"] < 0) {
            long = `${Math.abs(data["custom"]["payload"]["longitude"])}° W`
        } else {
            long = `${data["custom"]["payload"]["longitude"]}° E`
        }
        parent.document.getElementById('latest_time_card_side').innerHTML += `Latest Condition at ${data["custom"]["payload"]["currentConditions"]["datetime"].slice(0, 5)}`
        parent.document.getElementById('current_temp').innerHTML += `${data["custom"]["payload"]["currentConditions"]["temp"]}°C`
        parent.document.getElementById('current_feels').innerHTML += `${data["custom"]["payload"]["currentConditions"]["feelslike"]}°C`
        parent.document.getElementById('current_icon').innerHTML += `<img src="static/weather icons/${data["custom"]["payload"]["currentConditions"]["icon"]}.svg" alt="">`
        parent.document.getElementById('current_words').innerHTML += `“${data["custom"]["payload"]["currentConditions"]["conditions"]}”`
        parent.document.getElementById('through_icon').innerHTML += `<img src="static/weather icons/${data["custom"]["payload"]["days"][0]["icon"]}.svg" alt="">`
        parent.document.getElementById('through_words').innerHTML += `“${data["custom"]["payload"]["days"][0]["conditions"]}”`
        parent.document.getElementById('sunrise').innerHTML += data["custom"]["payload"]["currentConditions"]["datetime"].slice(0, 5)
        parent.document.getElementById('sunset').innerHTML += data["custom"]["payload"]["days"][0]["sunset"].slice(0, 5)
        parent.document.getElementById('through_temp').innerHTML += `${data["custom"]["payload"]["days"][0]["temp"]}°C`
        parent.document.getElementById('through_feels').innerHTML += `${data["custom"]["payload"]["days"][0]["feelslike"]}°C`
        parent.document.getElementById('through_temp_max').innerHTML += `${data["custom"]["payload"]["days"][0]["tempmax"]}°C`
        parent.document.getElementById('through_temp_min').innerHTML += `${data["custom"]["payload"]["days"][0]["tempmin"]}°C`
        parent.document.getElementById('through_feels_max').innerHTML += `${data["custom"]["payload"]["days"][0]["feelslikemax"]}°C`
        parent.document.getElementById('through_feels_min').innerHTML += `${data["custom"]["payload"]["days"][0]["feelslikemin"]}°C`
        parent.document.getElementById('location_address').innerHTML += data["custom"]["payload"]["address"]
        parent.document.getElementById('location_lat_long').innerHTML += lat + long
        parent.document.getElementById('location_timezone').innerHTML += `${data["custom"]["payload"]["timezone"]} (GMT ${data["custom"]["payload"]["tzoffset"]})`
        parent.document.getElementById('datetime').innerHTML += data["custom"]["payload"]["days"][0]["datetime"]
        parent.document.getElementById('guide_details').innerHTML += `📆 : Throughout the Day | ⏳ : Latest Condition at  ${data["custom"]["payload"]["currentConditions"]["datetime"].slice(0, 5)}`
        parent.document.getElementById('humidity').innerHTML += `📆 : ${data["custom"]["payload"]["days"][0]["humidity"]}%<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["humidity"]}%`
        parent.document.getElementById('solar_energy').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["solarenergy"]} MJ/m<sup>2</sup><br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["solarenergy"]} MJ/m<sup>2</sup>`
        parent.document.getElementById('wind_speed').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["windspeed"]} km/h<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["windspeed"]} km/h`
        parent.document.getElementById('cloud_cover').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["cloudcover"]}%<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["cloudcover"]}%`
        parent.document.getElementById('pressure').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["pressure"]} mb<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["pressure"]} mb`
        parent.document.getElementById('solar_radi').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["solarradiation"]} W/m<sup>2</sup><br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["solarradiation"]} W/m<sup>2</sup>`
        parent.document.getElementById('wind_gust').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["windgust"]} km/h<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["windgust"]} km/h`
        parent.document.getElementById('snow').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["snow"]} cm<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["snow"]} cm`
        parent.document.getElementById('visibility').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["visibility"]} km<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["visibility"]} km`
        parent.document.getElementById('uv_index').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["uvindex"]}/10<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["uvindex"]}/10`
        parent.document.getElementById('wind_dir').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["winddir"]}°<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["winddir"]}°`
        parent.document.getElementById('snow_depth').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["snowdepth"]} cm<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["snowdepth"]} cm`
        parent.document.getElementById('precip').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["precip"]} mm<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["precip"]} mm`
        parent.document.getElementById('precip_type').innerHTML += `📆 :  ${data["custom"]["payload"]["days"][0]["preciptype"]}<br>⏳ :  ${data["custom"]["payload"]["currentConditions"]["preciptype"]}`
        parent.document.getElementById('moon_icon').innerHTML += `<img src="static/weather icons/${data["custom"]["payload"]["days"][0]["moonphase"]}.svg" alt="">`
        parent.document.getElementById('moon_name').innerHTML += data["custom"]["payload"]["days"][0]["moonphase"]
        parent.document.getElementById('weather_desc').innerHTML += `“${data["custom"]["payload"]["days"][0]["description"]}”`
    }
}

function modal_send_data_function(check_box_list) {
    input_text.disabled = false;
    input_text.focus()
    console.log(check_box_list)
}

function in_chat_button_function(text, payload) {
    input_text.disabled = false;
    user_message = payload
    const element = document.getElementById("bot_buttons");
    element.remove()
    send_user_message_to_backend(payload);
    display_user_message(text);
    input_text.value = ''
    input_text.focus()
}

parent.window.onclick = function (event) {
    const weather_list = parent.document.getElementById("weather_list");
    const all_weather_details = parent.document.getElementById("all_weather_details");
    if (event.target === bot_modal) {
        input_text.disabled = false;
        bot_modal.style.display = "none";
        all_weather_details.style.display = "none"
        weather_list.innerHTML = ''
        let list = [
            'latest_time_card_side', 'current_temp', 'current_feels', 'current_icon', 'current_words', 'through_icon',
            'through_words', 'sunrise', 'sunset', 'through_temp', 'through_feels', 'through_temp_max', 'through_temp_min',
            'through_feels_max', 'through_feels_min', 'location_address', 'location_lat_long', 'location_timezone',
            'datetime', 'guide_details', 'humidity', 'solar_energy', 'wind_speed', 'cloud_cover', 'pressure', 'solar_radi',
            'wind_gust', 'snow', 'visibility', 'uv_index', 'wind_dir', 'snow_depth', 'precip', 'precip_type', 'moon_icon',
            'moon_name', 'weather_desc'
        ]
        for (let i = 0; i < list.length; i++) {
            parent.document.getElementById(list[i]).innerHTML = ''
        }
    }
}

document.getElementById("submit_button").onclick = function () {
    const input_data_value = input_text.value
    if (input_data_value !== '') {
        parent.document.getElementById('bottom_arrow').style.display = "none";
        parent.document.getElementById('top_arrow').style.display = "none";
        display_user_message(input_data_value);
        send_user_message_to_backend(input_data_value)
    }
    input_text.value = ''
    input_text.focus()
}

document.getElementById("clear_button").onclick = function () {
    if (middle_body.innerHTML !== '') {
        if (input_text.disabled) {
            input_text.disabled = false;
            const element = document.getElementById("bot_buttons");
            element.remove()
        }
        console.log("User: Clear chat button clicked");
        add_bot_html_text('Clearing the chat area')
        setTimeout(() => {
            middle_body.innerHTML = ''
        }, 1200)
        input_text.value = ''
        input_text.focus()
    }
}

document.getElementById("close_button").onclick = function () {
    console.log("User: Close chat button clicked");
    if (input_text.disabled) {
        input_text.disabled = false;
        const element = document.getElementById("bot_buttons");
        element.remove()
    }
    send_user_message_to_backend('/restart')
    add_bot_html_text('Closing the chat popup');
    setTimeout(() => {
        middle_body.innerHTML = ''
        setTimeout(() => {
            parent.counter()
            location.reload();
            console.log("Bot: Closed the chat popup")
        }, 500)
    }, 1200)
    input_text.value = ''
    input_text.focus()
}


document.getElementById("restart_button").onclick = function () {
    console.log("User: Restart chat button clicked");
    if (input_text.disabled) {
        input_text.disabled = false;
        const element = document.getElementById("bot_buttons");
        element.remove()
    }
    send_user_message_to_backend('/restart')
    add_bot_html_text('Restarting the chat')
    setTimeout(() => {
        add_bot_html_text('Chat has been Restarted')
    }, 1200)
    input_text.value = ''
    input_text.focus()
}

// function set_all_weather_details(data) {
//
//
// }

// function form_button_function(button_id) {
//     // const middle_body = document.getElementById("middle_body");
//     // const form_chat = document.getElementById("todo_form");
//     // const formData = new FormData(form_chat);
//     // formData.append("sender_id", sessionStorage.getItem('sender_id'))
//     // formData.append("close_chat", "")
//     // formData.append("restart_chat", "")
//     // const input_data = document.getElementById("input_text");
//     // const input_data_value = input_data.value
//     // const element = document.getElementById("botTyping");
//     // console.log(button_id)
//     // if (button_id === "clear_button" && middle_body.innerHTML !== ''){
//     //     middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//     //     middle_body.scrollTo(0, middle_body.scrollHeight);
//     //     const element = document.getElementById("botTyping");
//     //     setTimeout(() => {
//     //         element.remove()
//     //         middle_body.innerHTML += "<p class='botMsg'> Clearing the chat area </p><div class='clearfix'></div>";
//     //         middle_body.scrollTo(0, middle_body.scrollHeight);
//     //         setTimeout(() => {
//     //             middle_body.innerHTML = ''
//     //         }, 700)
//     //     }, 500)
//     // }else
//     //     if (button_id === "close_button"){
//     //     // formData.set("close_chat", "/restart")
//     //     middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//     //     middle_body.scrollTo(0, middle_body.scrollHeight);
//     //     const element = document.getElementById("botTyping");
//     //     setTimeout(() => {
//     //         element.remove()
//     //         middle_body.innerHTML += "<p class='botMsg'> Closing the chat popup </p><div class='clearfix'></div>";
//     //         middle_body.scrollTo(0, middle_body.scrollHeight);
//     //         setTimeout(() => {
//     //             middle_body.innerHTML = ''
//     //         }, 600)
//     //     }, 500)
//     // }else
//     //     if (button_id === "restart_button"){
//     //     // formData.set("restart_chat", "/restart")
//     //     middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//     //     middle_body.scrollTo(0, middle_body.scrollHeight);
//     //     const element = document.getElementById("botTyping");
//     //     setTimeout(() => {
//     //         element.remove()
//     //         middle_body.innerHTML += "<p class='botMsg'>Restarting the chat</p><div class='clearfix'></div>";
//     //         middle_body.scrollTo(0, middle_body.scrollHeight);
//     //     }, 300)
//     // }else
//         if (input_data_value !== "" && button_id === "submit_button") {
//         console.log("User: ", input_data_value)
//         middle_body.innerHTML += "<p class='userMsg'>" + input_data_value + "</p><div class='clearfix'></div>";
//         middle_body.scrollTo(0, middle_body.scrollHeight);
//     }
//     if ((input_data_value !== "" && button_id === "submit_button") || (button_id === "restart_button") || (button_id === "close_button")){
//         parent.document.getElementById('bottom_arrow').style.display = "none";
//         parent.document.getElementById('top_arrow').style.display = "none";
//         fetch('/chat_body', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({'message': 'hello', 'sender': sessionStorage.getItem('sender_id')})                       ,
//         }).then(function (response) {
//             return response.json()
//         }).then(function (data) {
//             console.log(data)
//             if (button_id === "restart_button"){
//                 console.log("Restarted the chat" )
//                 setTimeout(() => {
//                     middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//                     middle_body.scrollTo(0, middle_body.scrollHeight);
//                     const element = document.getElementById("botTyping");
//                     setTimeout(() => {
//                         element.remove()
//                         middle_body.innerHTML += "<p class='botMsg'>Chat has been Restarted</p><div class='clearfix'></div>";
//                         middle_body.scrollTo(0, middle_body.scrollHeight);
//                     }, 1000)
//                 }, 700)
//             }else if (button_id === "close_button"){
//                 setTimeout(() => {
//                     parent.counter()
//                     location.reload(true);
//                 }, 1300)
//                 console.log("Closed the chat popup")
//             }else{
//                 middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//                 middle_body.scrollTo(0, middle_body.scrollHeight);
//                 const element = document.getElementById("botTyping");
//                 setTimeout(() => {
//                     element.remove()
//                     data.forEach(function (obj) {
//                         console.log("Bot: ", obj.text.replace('\n', '<br>'))
//                         middle_body.innerHTML += "<p class='botMsg'>" + obj.text.split('\n').join('<br>') + "</p><div class='clearfix'></div>";
//                         if (obj.buttons){
//                             middle_body.innerHTML += "<div class='botMsg' id='bot_buttons'></div><div class='clearfix'></div>"
//                             const bot_buttons = document.getElementById("bot_buttons");
//                             obj.buttons.forEach(function (obj) {
//                                 console.log(obj.title, obj.payload)
//                                 bot_buttons.innerHTML += "<div class='menuChips' data-payload='" + obj.payload + "'>" + obj.title + "</div>";
//                             })
//                         }
//                     })
//                     middle_body.scrollTo(0, middle_body.scrollHeight);
//                 }, 1000)
//             }
//         });
//     }
//     input_data.value = ''
//     input_data.focus()
// }


// const form_chat = document.getElementById("todo_form");
// const formData = new FormData(form_chat);
// formData.append("sender_id", sessionStorage.getItem('sender_id'))
// formData.append("close_button", "")
// formData.append("restart_button", "")
// const middle_body = document.getElementById("middle_body");
// const input_data = document.getElementById("inout_text");
// document.getElementById("restart_button").onclick = function () {
//     console.log("restart")
//     // {#const formData = new FormData(form_chat);#}
//     // {#formData.append("sender_id", sessionStorage.getItem('sender_id'))#}
//     formData.set("restart_button", "/restart")
//     fetch('/chat_body', {   // assuming the backend is hosted on the same server
//         method: 'POST',
//         body: formData,
//     });
// }
// document.getElementById("close_button").onclick = function () {
//     console.log("restart")
//     // {#const formData = new FormData(form_chat);#}
//     // {#formData.append("sender_id", sessionStorage.getItem('sender_id'))#}
//     formData.set("close_button", "/restart")
//     fetch('/chat_body', {   // assuming the backend is hosted on the same server
//         method: 'POST',
//         body: formData,
//     }).then(function (response) {
//         return response.json()
//     }).then(function (data) {
//         middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//         middle_body.scrollTo(0, middle_body.scrollHeight);
//         console.log(data)
//         setTimeout(() => {
//             const element = document.getElementById("botTyping");
//             element.remove()
//             data.forEach(function (obj) {
//                 middle_body.innerHTML += "<p class='botMsg'>" + obj.text + "</p><div class='clearfix'></div>";
//             })
//             middle_body.scrollTo(0, middle_body.scrollHeight);
//         }, 1000)
//     });
//     // {#parent.counter()#}
// }
// // form_chat.addEventListener('submit', function (event) {
// document.getElementById("submit_button").onclick = function () {
//     // event.preventDefault();
//     const text_input = input_data.value;
//     // const formData = new FormData(form_chat);
//     // formData.append("sender_id", sessionStorage.getItem('sender_id'))
//     // formData.append("close_button", "")
//     // formData.append("restart_button", "")
//     if (text_input !== "") {
//         console.log(text_input)
//         middle_body.innerHTML += "<p class='userMsg'>" + text_input + "</p><div class='clearfix'></div>";
//         middle_body.scrollTo(0, middle_body.scrollHeight);
//         fetch('/chat_body', {   // assuming the backend is hosted on the same server
//             method: 'POST',
//             body: formData,
//         }).then(function (response) {
//             return response.json()
//         }).then(function (data) {
//             middle_body.innerHTML += "<div class='botTyping' id='botTyping'><div class='bounce1'></div> <div class='bounce2'> </div> <div class='bounce3'> </div> </div>"
//             middle_body.scrollTo(0, middle_body.scrollHeight);
//             console.log(data)
//             setTimeout(() => {
//                 const element = document.getElementById("botTyping");
//                 element.remove()
//                 data.forEach(function (obj) {
//                     middle_body.innerHTML += "<p class='botMsg'>" + obj.text + "</p><div class='clearfix'></div>";
//                 })
//                 middle_body.scrollTo(0, middle_body.scrollHeight);
//             }, 1000)
//         });
//         input_data.value = ''
//         input_data.focus()
//     }
// }