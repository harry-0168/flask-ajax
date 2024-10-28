from flask import Flask, request, jsonify, Response
from markupsafe import escape
import time



class item:
    def __init__(self, url, text):
        self.url = url
        self.text = text
        self.count = 0
        self.children = []

    def add_child(self,child):
        self.children.append(child) # insert child at the end
        self.count += 1

    def remove_child(self, index):  # index = number - 1
        self.children.pop(index) # remove child at index
        self.count -= 1

    def update_child(self, index, child):
        self.children[index] = child
    
    def to_dict(self):
        return {
            'url': self.url,
            'text': self.text,
            'children': [child.url for child in self.children]
        }
    
app = Flask(__name__)
root = item('/outline/', 'root') # root item
changes = {} # changes to the outline, key is the url of the item, value is the item attributes and the type of change(add, update, delete), timestamp
    
@app.route('/', methods=['GET'])
def home():
    # serve ui.html in current path
    with open('ui.html') as f:
        return Response(f.read(), mimetype='text/html')

@app.route('/style.css', methods=['GET'])
def style():
    # serve style.css in current path
    with open('style.css') as f:
        return Response(f.read(), mimetype='text/css')

@app.route('/main.js', methods=['GET'])
def script():
    # serve main.js in current path
    with open('main.js') as f:
        return Response(f.read(), mimetype='text/javascript')

@app.route('/favicon.ico', methods=['GET'])
def favicon():
    # serve favicon.ico in current path
    with open('favicon.ico', 'rb') as f:
        return Response(f.read(), mimetype='image/x-icon')

########
# API #
@app.route('/outline/', methods=['GET', 'POST', 'PUT', 'DELETE'])
def outline():
    global root
    if request.method == 'POST': # create an item inside root
        try:
            child = item(f'/outline/{root.count}', request.json['text'])
            root.add_child(child)
            changes[child.url] = {'text': child.text, 'type': 'add', 'timestamp': int(time.time()), 'url': child.url, 'children': [child.url for child in child.children]}
            return jsonify(child.to_dict()), 201
        except KeyError:
            return jsonify({'error': KeyError}), 400
    elif request.method == 'GET':       # get the root item
        return jsonify(root.to_dict()), 200
    elif request.method == 'PUT':
        try:
            root.text = request.json['text']
            changes[root.url+"put"] = {'text': root.text, 'type': 'update', 'timestamp': int(time.time()), 'url': root.url}
            return jsonify(root.to_dict()), 201
        except KeyError:
            return jsonify({'error': KeyError}), 400
    elif request.method == 'DELETE':
        # delete 
        return jsonify({'error': 'Cannot delete root item'})

@app.route('/outline/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def outlineId(subpath):
    global root
    global changes
    parts = subpath.split('/')
    current = root
    parent = None  # we need to save parent reference to delete a child as we cannot go one step back in the tree
    childIndex = -1 # index of the child in the parent to be deleted
    try:
        for part in parts:
            if part == '' or part == 'outline' or not part.isnumeric():
                continue
            index = int(part) 
            if index < 0 or index > current.count-1:
                return jsonify({'error': f'Invalid index {index} {current.count}'})
            if request.method == 'DELETE':
                parent = current
                childIndex = index
            current = current.children[index]
        if request.method == 'POST':
            child = item(f'/outline/{subpath}/{current.count}', request.json['text'])
            current.add_child(child)
            changes[child.url] = {'text': child.text, 'type': 'add', 'timestamp': int(time.time()), 'url': child.url, 'children': [child.url for child in child.children]}
            return jsonify(child.to_dict()), 201
        elif request.method == 'GET':
            return jsonify(current.to_dict()), 200
        elif request.method == 'PUT':
            current.text = request.json['text']
            changes[current.url+"put"] = {'text': current.text, 'type': 'update', 'timestamp': int(time.time()), 'url': current.url}
            return jsonify(current.to_dict()), 201
        elif request.method == 'DELETE':
            parent.remove_child(childIndex)
            changes[current.url] = {'text': current.text, 'type': 'delete', 'timestamp': int(time.time()), 'url': current.url}
            return jsonify(current.to_dict()), 201
    except KeyError:
        return jsonify({'error': KeyError}), 400


###########
# polling #

# I want to remove the elements from the changes dictionary that are older than 10 seconds


import threading

# Function to clean up old entries in changes dictionary
def cleanup_changes():
    while True:
        current_time = int(time.time())
        # Filter out changes older than 10 seconds
        keys_to_delete = [key for key, value in changes.items() if current_time - value['timestamp'] > 10]
        for key in keys_to_delete:
            print(f"Removing {key} from changes")
            del changes[key]
        time.sleep(5)  # Check every 5 seconds

# Start cleanup thread
cleanup_thread = threading.Thread(target=cleanup_changes, daemon=True)
cleanup_thread.start()

# Polling endpoint to get recent changes
@app.route('/poll-changes', methods=['GET'])
def poll_changes():
    return jsonify(list(changes.values())), 200



if __name__ == '__main__':
    app.run(debug=True)
