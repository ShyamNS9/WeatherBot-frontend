import pprint
from flask import Flask, render_template, request, make_response
import requests
import json

app = Flask(__name__)
app.debug = True


@app.route("/")
def chat():
    return render_template('index.html')


@app.route("/chat_body", methods=['GET', 'POST'])
def chat_body():
    print(request.headers.get('Content-Type'))
    if request.method == "POST":
        print(request.headers.get('Content-Type'))
        front_end_data = request.json
        if front_end_data:
            data_from_user = json.dumps(front_end_data)
            print("USER: ", data_from_user)
            headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
            try:
                res = requests.post('http://localhost:5005/webhooks/rest/webhook', data=data_from_user, headers=headers)
                print("BOT: ")
                pprint.pprint(res.json())
                response = make_response(json.dumps(res.json()))
            except requests.exceptions.ConnectionError as e:
                response = make_response(json.dumps([{
                    'recipient_id': f'{front_end_data.get("sender")}',
                    'text': 'Sorry! Failed to establish connection. 😰\nPlease try again after some time.'
                }]))
        else:
            response = make_response(json.dumps([{
                'recipient_id': 'current_user',
                'text': 'Sorry! Failed to establish connection. 😰\nPlease try again after some time.'
            }]))
        return response
    return render_template('chat_body.html')


if __name__ == '__main__':
    app.run(debug=True)
