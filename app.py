from flask import Flask, request, jsonify, Response
from markupsafe import escape



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
    if request.method == 'POST': # create a root item
        if root is None:
            root = item('/outline/', request.json['text'])
        else:
            child = item(f'/outline/{root.count}', request.json['text'])
            root.add_child(child)
        return jsonify(root.to_dict())
    elif request.method == 'GET':       # get the root item
        return jsonify(root.to_dict())
    elif request.method == 'PUT':
        root.text = request.json['text']
        return jsonify(root.to_dict())
    


    return jsonify(root.to_dict())

@app.route('/outline/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def outlineId(subpath):
    parts = subpath.split('/')
    current = root
    parent = None  # we need to save parent reference to delete a child as we cannot go one step back in the tree
    childIndex = -1 # index of the child in the parent to be deleted
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
        return jsonify(current.to_dict())
    elif request.method == 'GET':
        return jsonify(current.to_dict())
    elif request.method == 'PUT':
        current.text = request.json['text']
        return jsonify(current.to_dict())
    elif request.method == 'DELETE':
        parent.remove_child(childIndex)
        return jsonify(current.to_dict())
    
    return f'Subpath {escape(subpath)}'

if __name__ == '__main__':
    app.run(debug=True)
