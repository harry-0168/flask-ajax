'use strict';

// global variable to store the current data
let currentData = {
    text: '',
    children: [],
    url: ''     
};
let current_page= null;

let pageData = {} // store the data for each page. key is the url, value is the data object

window.addEventListener('load', main());

function render(data){
    
    // render the data
    // data is an object with the following properties: text, children (array), url
    // children array contains url for each child
    // render the data in the following format:
    // <div>
    //     <p>text</p>
    //     <p>url</p>
    //     <ul>
    //         <li><a href="url">child1</a></li>
    //         <li><a href="url">child2</a></li>
    //         ...
    //     </ul>
    //     <input type="text" id="create">
    //     <button id="createButton">Create</button>
    //     <button id="deleteButton">Delete</button>
    //     <input type="text" id="update">
    //     <button id="updateButton">Update</button>
    // </div>
    // remove all the children of the body
    // remove h1 element in body
    let h1 = document.querySelector('h1');
    if (h1) {
        h1.remove();
    }
    currentData = data;
    pageData[data.url] = data;
    let div = document.createElement('div');
    div.classList.add('container', data.url); 
    let p = document.createElement('h2');
    p.classList.add('header', data.url);
    p.textContent = "Text:  "+data.text;
    div.appendChild(p);
    // let p2 = document.createElement('a');
    // p2.href = '';
    // p2.id = 'currentUrl';
    // p2.textContent = data.url;
    // p2.classList.add('url');
    // p2.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     makeRequest(data.url);
    // });
    // div.appendChild(p2);
    let ul = document.createElement('ul');
    ul.classList.add('list', data.url);
    data.children.forEach(child => {
        let li = document.createElement('li');
        li.classList.add('list-item', child);
        li.id = child;  
        let a = document.createElement('a');
        a.classList.add('url', child);
        a.href = child;
        a.textContent = child;
        // a.addEventListener('click', (e) => {
        //     e.preventDefault();
        //     makeRequest(child);
        // });
        let inp = document.createElement('input');
        inp.type = 'text';
        inp.classList.add('input', child);
        
        let button = document.createElement('button');
        button.textContent = 'Create New Item in current Outline';
        button.addEventListener('click', () => {
            makeRequest(data.url, 'POST', {text: inp.value});
        });
        button.classList.add('button', child);

        li.appendChild(a);
        li.appendChild(inp);
        li.appendChild(button);
        ul.appendChild(li);
    });
    div.appendChild(ul);

    let inp = document.createElement('input');
    inp.type = 'text';
    inp.classList.add('input', data.url);
    div.appendChild(inp);
    let button = document.createElement('button');
    button.textContent = 'Create New Item in current Outline';
    button.addEventListener('click', () => {
        makeRequest(data.url, 'POST', {text: inp.value});
    });
    button.classList.add('button', data.url);
    div.appendChild(button);

    if (data.url != '/outline/') {
        let button2 = document.createElement('button');
        button2.id = 'deleteButton';
        button2.textContent = 'Delete current Item';
        button2.addEventListener('click', () => {
        makeRequest(data.url, 'DELETE');
        });
        button2.classList.add('button', data.url);
        div.appendChild(button2);
    }
    

    let inp2 = document.createElement('input');
    inp2.type = 'text';
    inp2.classList.add('input', data.url);
    div.appendChild(inp2);

    let button3 = document.createElement('button');
    button3.textContent = 'Update';
    button3.addEventListener('click', () => {
        makeRequest(data.url, 'PUT', {text: inp2.value});
    });
    button3.classList.add('button', data.url);
    div.appendChild(button3);
    if (data.url == '/outline/') {
        document.body.appendChild(div); 
    }
    else{
        // select th list item with the id of the url
        let parent = document.getElementById(`${data.url}`);
        if (parent) {
            parent.appendChild(div);
        }
    }
    data.children.forEach(element => {
        makeRequest(element);
    });
}

function makeRequest(url,method= 'GET', body={}){
    if (method === 'GET') {
        return fetch(url, {
            method: method
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                current_page = url;
                render(data);
            });
    }
    else if(method === 'DELETE'){
        return fetch(url, {
            method: method
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // delete the last child of ul
                makeRequest('/outline');
  
            });
    }
    return fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            render(data);
        });
}

function check(data){
    // check if the data is different from the current data
    // if it is different, call render
    if (data.text !== currentData.text || data.children !== currentData.children || data.url !== currentData.url) {
        currentData = data;
        // render(data);
    }
}

function polling(url){
    setInterval(() => {
        fetch(url, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                check(data); // check if the data is different from the current data
            });
    }, 3000);
}



function main() {
    // make fetch request to get the data for current page
    current_page = window.location.pathname;
    if (!current_page.startsWith('/outline')) {
        current_page = '/outline';
    }
    makeRequest(current_page);
    
    polling(current_page);
}
