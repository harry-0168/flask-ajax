'use strict';


let current_page= null;

let pageData = {} // store the data for each page. key is the url, value is the data object

window.addEventListener('load', main());

function editableItem(urlid){
    let div = document.createElement('div');
    div.classList.add('editable-item');
    div.textContent = 'Not set';
    div.contentEditable = true;
    div.spellcheck = false;
    div.id = urlid;
    let originalText = div.innerText;

    // Track if changes occur
    div.addEventListener("input", (event) => {
        if (div.innerText !== originalText) {
            console.log("Text changed!");
            // You could dispatch a custom event here
            // makeRequest(urlid, 'PUT', { "text": div.innerText }, false);
            makeRequest(urlid, 'PUT', { "text": div.innerText }, false);
        }
    });

    // When user clicks elsewhere, reset or save changes
    div.addEventListener("blur", () => {
        if (div.innerText !== originalText) {
            console.log("Changes detected and focus lost, saving changes.");
            originalText = div.innerText;  // Update original text to current value
            // Trigger save logic here
            makeRequest(urlid, 'PUT', { "text": div.innerText }, false);
        }
    });

    // Optional: Trigger editing on double-click for user experience
    div.addEventListener("dblclick", () => {
        div.focus();
    });
    return div;
}

async function render(parent, data) {
    pageData[data.url] = data;
    parent.style.display = 'flex';

    let li = document.createElement('li');
    li.classList.add(data.url);

    let element = editableItem(data.url);
    element.textContent = data.text;

    li.appendChild(element);
    parent.appendChild(li);
    console.log(data.children);
    // if (data.children.length === 0) {  // If no children, return early
    //     // put the add button and delete button in a div
    //     // Add an "Add" button for adding children
    //     let addButton = document.createElement('button');
    //     addButton.textContent = 'Add';
    //     addButton.classList.add('add', data.url+'button');
    //     // Attach event to POST a new child item
    //     addButton.addEventListener('click', function () {
    //         makeRequest(data.url, 'POST', { "text": "click to edit" }, false);
    //     });
    //     parent.appendChild(addButton);
    //     // Add a "Delete" button for deleting the current item
    //     let deleteButton = document.createElement('button');
    //     deleteButton.textContent = 'Delete';
    //     deleteButton.classList.add('delete', data.url+'button');

    //     // Attach event to DELETE the current item
    //     if (data.url !== '/outline/') {
    //     deleteButton.addEventListener('click', function () {
    //         makeRequest(data.url, 'DELETE', {}, false);
    //     });
    //     parent.appendChild(deleteButton);}

    //     let ul = document.createElement('ul');
    //     ul.classList.add(data.url);
    //     // hide the ul
    //     ul.style.visibility = 'hidden';
    //     parent.appendChild(ul);

    //     return;
    // }
    // Add an "Add" button for adding children
    let divButton = document.createElement('div');
    divButton.classList.add('button-div');
    let addButton = document.createElement('button');
    addButton.textContent = 'Add';
    addButton.classList.add('add', data.url+'button');

    // Attach event to POST a new child item
    addButton.addEventListener('click', function () {
        makeRequest(data.url, 'POST', { "text": "click to edit" }, false);
    });
    divButton.appendChild(addButton);
    
    // Add a "Delete" button for deleting the current item
    let deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete', data.url+'button');

    // Attach event to DELETE the current item
    deleteButton.addEventListener('click', function () {
        makeRequest(data.url, 'DELETE', {}, false);
    });
    divButton.appendChild(deleteButton);
    parent.appendChild(divButton);

    let ul = document.createElement('ul');
    ul.classList.add(data.url);
    ul.style.display = 'none'
    parent.appendChild(ul);
    if (data.children.length === 0) {
        return;
    }

    // Loop over each child and wait for makeRequest to get the data
    for (const childUrl of data.children) {
        // Wait for makeRequest to fetch the child data before calling render on it
        if (childUrl === null)
            continue;
        const childData = await makeRequest(childUrl, 'GET', {}, false);
        await render(ul, childData); // Recursively render each child
    }

    
}


async function makeRequest(url,method= 'GET', body={}, initializePage=false) {
    if (method === 'GET') {
        return await fetch(url, {
            method: method
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (initializePage) {
                    let h1 = document.querySelector('h1');
                    if (h1) {
                        h1.remove();
                    }
                    let ul = document.createElement('ul');
                    ul.classList.add('/outline/', 'root');
                    document.body.appendChild(ul);
                    render(ul,data);
                }
                else {
                    // return the data
                    return data;
                }  
            });
    }
    else if(method === 'DELETE'){
        return await fetch(url, {
            method: method
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // delete the last child of ul
                // remove all the element with class data.url
                pageData[data.url] = null;
                let elements = document.querySelectorAll('.' + CSS.escape(data.url));
                let buttons = document.querySelectorAll('.' + CSS.escape(data.url+'button'));
                elements.forEach((element) => {
                    element.remove();
                });   
                buttons.forEach((button) => {
                    button.remove();
                });
            });
    }
    return await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (method === 'POST') {
                // add the new child to the ul
                let ul = document.querySelectorAll('.' + CSS.escape(url));
                render(ul[ul.length -1], data);
            }
            else if (method === 'PUT') {
                // update the text of the element
                let element = document.getElementById(url);
                element.textContent = data.text;
            }
            
        });
}

/**
 *  polling logic
 */

async function poll() {
    // Fetch changes from the server
    let changes = await makeRequest('/poll-changes', 'GET', {}, false);
    
    // Process each change from the server response
    for (let change of changes) {
        const { url, type, text, children } = change;

        if (type === 'add') {
            // Check if the item is already in pageData to avoid duplication
            console.log(pageData[url]);
            if (!pageData[url]) {
                // Render new item and add it to pageData

                
                let parentUrl = url.substring(0, url.lastIndexOf('/'));
                if(parentUrl === '/outline'){
                    parentUrl = '/outline/';
                }
                let parentUls = document.querySelectorAll(`ul.${CSS.escape(parentUrl)}`);
                let parentUl = parentUls[parentUls.length -1];

                // while(!parentUl){   // just incase parentUl is not created yet, but the child is encountered first
                //     parentUrl = parentUrl.substring(0, parentUrl.lastIndexOf('/'));
                //     parentUl = document.querySelector(`ul.${CSS.escape(parentUrl)}`);
                    
                // }
                
                if (parentUl) {
                    pageData[url] = change;
                    pageData[parentUrl].children.push(url);
                    await render(parentUl, change);
                }
            }
        } else if (type === 'update') {
            // If item exists, update the text content
            // I want to remove put string at the end of url: url = '/outline/1/2/3/4/5put' => url = '/outline/1/2/3/4/5'
            let urlParsed = url.replace('put', '');
            if (pageData[urlParsed]) {
                let element = document.getElementById(urlParsed);
                if (element) {
                    element.textContent = text;
                }
                pageData[urlParsed].text = text;
            }
        } else if (type === 'delete') {
            // If item exists, delete it from the DOM and pageData
            if (pageData[url]) {

                console.log('delete', text,url);
                // delete the last child of ul
                // remove all the element with class data.url
                pageData[url] = null;
                let elements = document.querySelectorAll('.' + CSS.escape(url));
                let buttons = document.querySelectorAll('.' + CSS.escape(url+'button'));
                elements.forEach((element) => {
                    element.remove();
                });   
                buttons.forEach((button) => {
                    button.remove();
                });
            }
        }
    }
}



async function main() {
    // make fetch request to get the data for current page
    current_page = window.location.pathname;
    if (!current_page.startsWith('/outline')) {
        current_page = '/outline';
    }
    await makeRequest(current_page, 'GET', {}, true); // initialize the page
    // Poll for changes every 5 seconds once the page is initialized
    setInterval(poll, 2000);
}
