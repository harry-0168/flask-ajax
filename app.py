from flask import Flask, request, jsonify, Response
from markupsafe import escape

app = Flask(__name__)
root = None # root item

class item:
    def __init__(self, url, text):
        self.url = url
        self.text = text
        self.children = []

    def add_child(self, index,child):
        self.children.insert(index, child) # insert child at index

    def remove_child(self, index):  # index = number - 1
        self.children.pop(index) # remove child at index

    def update_child(self, index, child):
        self.children[index] = child
    
    def to_dict(self):
        return {
            'url': self.url,
            'text': self.text,
            'children': [child.url for child in self.children]
        }
    
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

@app.route('/outline/', methods=['GET', 'POST', 'PUT', 'DELETE'])
def outline(request):

    if request.method == 'POST' and root is None: # create a root item
        root = item('/outline/', request.data['text'])
        return jsonify(root.to_dict())
    elif request.method == 'GET':       # get the root item
        return jsonify(root.to_dict())
    elif request.method == 'PUT':
        root.text = request.data['text']
        return jsonify(root.to_dict())
    elif request.method == 'DELETE':
        root = None
        return jsonify({})
    


    return jsonify(root.to_dict())

@app.route('/outline/<path:subpath>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def outlineId(request,subpath):
    parts = subpath.split('/')
    
    return f'Subpath {escape(subpath)}'
