function Reset(){ // Clear turns and attributes;
    Turn.count = 0;
    Turn.map.replaceChildren();
    Turn.new();
}

const State = {
    matrix: [],
    get array(){
        for (let r = 0; r < Resource.count; r++){
            console.log(this.res(r));
        }
    },
    port(n){
        return this.matrix[n];
    },
    res(n){
        return this.matrix.map(row => row[n]);
    },
    Red(res){
        for (let p = 0; p < Person.count; p++){
            if (this.matrix[p][res] != "G") this.matrix[p][res] = "R";
        }
    },
    Green(port, res){
        if (this.matrix[port][res] == "G") return;
        this.matrix[port] = Array(Resource.count).fill(" ");
        for (let p = 0; p < Person.count; p++){
            if (this.matrix[p][res] == "Y") this.matrix[p][res] = " ";
        }
        this.matrix[port][res] = "G";
    },
    status(res){
        for (let r of this.res(res)){
            if (r == "R") return "R";
            if (r == "Y") return "Y";
        }
        return "U";
    },
    score(port, res){
        if (this.matrix[port][res] != "U") return 0;
        let pLimit = this.matrix[port].filter(p => p == "U").length;
        let rLimit = this.res(res).filter(r => r == "U").length;
        return 1 / Math.min(pLimit, rLimit) * 100;
    }
}

const Person = {
    map:document.querySelector('.portrait.Map'),
    get nodes(){ return Array.from(Person.map.children)},
    get count(){ return Person.nodes.length},
    new(){
        let port = document.querySelector('#Temp').content.children[0].cloneNode(true);
        Person.map.append(port);
        port.title = `P${Person.count}`;
    },
    add(){
        Person.new(); Reset();
    },
    remove(e){
        if (Person.count > 1){
            e.target.closest('.port').remove();
        }
        Reset();
    }
};
for (let i = 0; i < 5; i++){
    Person.new();
}
const Resource = {
    map:document.querySelector('.resource.Map'),
    get nodes(){ return Array.from(Resource.map.children)},
    get count(){return Resource.nodes.length},
    new(){
        let res = document.querySelector('#Temp').content.children[1].cloneNode(true);
        Resource.map.append(res);
        res.title = `R${Resource.count}`;
        res.querySelector('p').textContent = res.title;
        res.querySelector('.addBtn').addEventListener('click', Resource.add);
        res.querySelector('.rmvBtn').addEventListener('click', Resource.remove);
    },
    add(){
        Resource.new(); Reset();
    },
    remove(e){
        if(Resource.count > 1){
            e.target.closest('.res').remove();
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
            //Reset compatability matrix
            for (let p = 0; p < Person.count; p++){
                State.matrix[p] = Array(Resource.count).fill("U");
            }
        } else { //Limit resources based on previous turn's feedback
            let {prev} = Turn;
            for (let p = 0; p < prev.length; p++){
                let r = +prev[p].querySelector('.select.input').value;
                let o = prev[p].querySelector('.select.output').getAttribute('value');
                if (prev[p].classList.contains('complete')) continue;
                if (o == "R"){
                    State.Red(r);
                } else if (o == "G"){
                    State.Green(p, r);
                } else {
                    State.matrix[p][r] = o;
                }
            }
            /*for (let c of prev){
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
            }*/
        }
        Turn.map.append(turn);

        //Build the next turn
        for (let p = 0; p < Person.count; p++){
            const choice = document.querySelector('#Temp').content.children[2].cloneNode(true);
            choice.title = Person.nodes[p].title;
            const i = choice.querySelector('.select.input');
            let n = State.matrix[p].indexOf("G");
            if (n > -1){
                const o = document.createElement('option'); o.value = n + 1; o.textContent = `R${n + 1}`;
                i.append(o);
                i.value = o.value;
                choice.classList.add('complete');
            } else {
                i.chance = 0;
                for (let r = 0; r < Resource.count; r++){
                    const prob = State.score(p, r);
                    if (prob > 0){
                        const o = document.createElement('option'); o.value = r; 
                        o.textContent = `R${r + 1} (${prob.toLocaleString('en-AU',{maximumFractionDigits:2})}%)`;
                        i.append(o);
                        if (prob == 100){
                            i.value = r;
                            break;
                        } else if (i.chance < prob){
                            i.value = r;
                            i.chance = prob;
                        }
                    }
                }
            }
            // Diversify choices: We want to select as many different available options as possible, but keep the score maximised.
            const selected = Array.from(turn.querySelectorAll('.choice:not(.complete)')).map(c => c.querySelector('.select.input').value);
            const free = Array.from(i.options)
                .filter(o => !selected.includes(o.value) && State.score(p, +o.value) >= State.score(p, +i.value));
            if (free.length > 0) i.value = free[0].value;
            turn.append(choice);
        }

        /*for (let p of Person.nodes){
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
        }*/
        Turn.count += 1;
        console.log(`Turn: `, Turn.count);
        return State.array;
    },
};

function MarkToggle(node){
    let sequence = ["Y","G","R","Y"], i = sequence.indexOf(node.getAttribute('value')) + 1;
    node.setAttribute('value', sequence[i]);
    node.style.backgroundImage = `url("Marker_${sequence[i]}.svg")`;
}

//#region Initialise
for (let i = 0; i < 4; i++){
    Resource.new();
}
Reset();