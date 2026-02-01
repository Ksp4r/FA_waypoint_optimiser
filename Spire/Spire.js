function Reset(){ // Clear turns and attributes;
    Turn.count = 0;
    Turn.map.replaceChildren();
    Turn.new();
}

const Person = {
    map:document.querySelector('.portrait.Map'),
    count: 0,
    get nodes(){ return Array.from(Person.map.children)},
    new(){
        let port = document.querySelector('#Temp').content.children[0].cloneNode(true);
        port.querySelector('.addBtn').addEventListener('click', Person.add);
        port.querySelector('.rmvBtn').addEventListener('click', Person.remove);
        return port;
    },
    add(){
        Person.count += 1;
        let port = Person.new();
        Person.map.append(port);
        port.title = `P${Person.count}`;
        Reset();
    },
    remove(e){
        if (Person.count > 1){
            Person.map.removeChild(e.target.closest('.port'));
            Person.count -= 1;
        }
        Reset();
    }
};
const Resource = {
    map:document.querySelector('.resource.Map'),
    count:0,
    get nodes(){ return Array.from(Resource.map.children)},
    new(){
        let res = document.querySelector('#Temp').content.children[1].cloneNode(true);
        res.querySelector('p').textContent = `R${Resource.map.children.length + 1}`;
        res.querySelector('.addBtn').addEventListener('click', Resource.add);
        res.querySelector('.rmvBtn').addEventListener('click', Resource.remove);
        return res;
    },
    add(){
        Resource.count += 1;
        let res = Resource.new();
        Resource.map.append(res);
        res.title = `R${Resource.count}`;
        Reset();
    },
    remove(e){
        if(Resource.count > 1){
            Resource.map.removeChild(e.target.closest('.res'));
            Resource.count -= 1;
        }
        Reset();
    }
};

const Turn = {
    map:document.querySelector('.turnMap'),
    count: 0,
    get prev(){
        return Array.from(Turn.map.children[Turn.count - 1].querySelectorAll('.choice'));
    },
    new(){
        let turn = document.createElement('div'); turn.classList.add('turn');
        if (Turn.count < 1){
            //Reset Person/Resource compatability
            for (let r of Resource.nodes){
                for (let p of Person.nodes){
                    r.setAttribute(p.title,"U");
                    p.setAttribute(r.title,"U");
                }
            }
        } else {
            //Limit resources based on previous Turn
            let {prev} = Turn;
            for (let c of prev){
                let i = c.querySelector('.select.input').value;
                let o = c.querySelector('.select.output').getAttribute('value');
                let cP = Person.nodes.find(p => p.title == c.title);
                let cR = Resource.nodes.find(r => r.title == i);
                if (cP.getAttribute(i) == "U"){
                    if (o == "R"){ // Red resources eliminated for all people
                        for (let p of Person.nodes){
                            if (p.getAttribute(i) != "G") p.setAttribute(i, "R");
                            cR.setAttribute(p.title, p.getAttribute(i));
                        }
                    } else if (o == "G"){ // Green people eliminated for all resources
                        for (let r of Resource.nodes){
                            if (r.getAttribute(c.title) != "G") r.setAttribute(c.title, "Y");
                            cP.setAttribute(r.title, "Y");
                        }
                    }
                    cP.setAttribute(i, o);
                    cR.setAttribute(c.title, o);
                }
            }
        }
        Turn.map.append(turn);

        //Build the next turn
        for (let p of Person.nodes){
            let choice = document.querySelector('#Temp').content.children[2].cloneNode(true);
            choice.title = p.title;
            let i = choice.querySelector('.select.input');
            for (let r of Resource.nodes){
                if (p.getAttribute(r.title) != "Y" && p.getAttribute(r.title) != "R"){
                    let o = document.createElement('option');
                    o.value = r.title; o.textContent = r.title;
                    i.append(o);
                    if (p.getAttribute(r.title) == "G"){
                        choice.classList.add('complete');
                        i.value = r.title;
                        break;
                    } else {
                        let pLimit = Resource.nodes.filter(r => r.getAttribute(p.title) == "U");
                        let rLimit = Person.nodes.filter(p => p.getAttribute(r.title) == "U");
                        let prob = 1 / Math.min(pLimit.length, rLimit.length) * 100;
                        o.textContent = `${r.title} (${prob.toLocaleString("en-AU", {maximumfractionDigits:2})}%)`;
                        if (prob == 100){
                            i.value = r.title;
                            prob = 1;
                            break;
                        } else if (!i.chance || i.chance < prob){
                            i.value = r.title;
                            i.chance = prob;
                        }
                    }
                }
            }
            if (turn.querySelectorAll(':not(.complete)').length > 0){
                let selected = Array.from(turn.querySelectorAll('.choice:not(.complete)')).map(c => c.querySelector('.select.input').value);
                let free = Array.from(i.options).filter(o => !selected.includes(o.value));
                if (free.length > 0){ i.value = free[0].value};
            }
            turn.append(choice);
        }
        let tEnd = document.querySelector('#Temp').content.children[3].cloneNode(true);
        turn.append(tEnd);
        Turn.count += 1;
    },
};
function MarkToggle(node){
    let sequence = ["Y","G","R","Y"], i = sequence.indexOf(node.getAttribute('value')) + 1;
    node.setAttribute('value', sequence[i]);
    node.style.backgroundImage = `url("Marker_${sequence[i]}.svg")`;
}

//#region Initialise
for (let i = 0; i < 4; i++){
    Person.add();
    Resource.add();
}