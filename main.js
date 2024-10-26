'use strict';

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
    // </div>
    let div = document.createElement('div');
    let p = document.createElement('h2');
    p.textContent = "Text:  "+data.text;
    div.appendChild(p);
    let p2 = document.createElement('a');
    p2.href = '';
    p2.textContent = data.url;
    div.appendChild(p2);
    let ul = document.createElement('ul');
    data.children.forEach(child => {
        let li = document.createElement('li');
        let a = document.createElement('a');
        a.href = '';
        a.textContent = child;
        li.appendChild(a);
        ul.appendChild(li);
    });
    div.appendChild(ul);
    document.body.appendChild(div);
    // change the innserHTML of the h1 which is first child inside the body to the text of the data
    document.body.children[0].innerHTML = 'Loaded'


}



function main() {
    // make fetch request to get the data for current page
    let current_page = window.location.pathname;
    if (!current_page.startsWith('/outline')) {
        current_page = '/outline';
    }
    console.log(current_page);
    fetch(current_page)
        .then(response => response.json())
        .then(data => {
            // render the data
            console.log(data);
            render(data);
        });
}
