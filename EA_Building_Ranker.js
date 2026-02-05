const Roman = ["0","I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","21","22"];
var buildings = [];
var stored = [];

//Inline stylesheet for global classes
{   let bStyle = document.createElement('style');
    document.head.append(bStyle);
    bStyle.textContent = `.kspar-leftBar{
        position: fixed;
        left: 15px;
        top: 45px;
        display:flex;
        flex-flow: column;
        align-items: flex-start;
        gap: 15px;
        user-select: none;
    }
    #rank_legend{
        position: fixed;
        display: flex;
        flex-flow: column;
        right: 15px;
        top: 45px;
        width: 150px;
        transform-origin: right top;
    }
    .kspar-button{
        cursor: pointer;
    }
    .kspar-active {
        color: yellow;
        cursor: default;
        pointer-events: none;
    }
    .kspar-active #layout_chapter {
        pointer-events: all;
    }
    `;
}

//#region Build html items
const bar = document.createElement('div'); bar.id="EA_Bar"; bar.classList.add('kspar-leftBar'); document.body.append(bar);

let a = document.createElement('a'); a.textContent = "Culture Ranking"; a.setAttribute('value','Culture'); a.classList.add('kspar-button','kspar-filter');
bar.append(a); a.addEventListener('click', EA_Rank_Click);

let p = document.createElement('a'); p.textContent = "Population Ranking"; p.setAttribute('value','Population'); p.classList.add('kspar-button','kspar-filter');
bar.append(p); p.addEventListener('click', EA_Rank_Click);

let clr = document.createElement('a'); clr.textContent = "Clear Ranking"; clr.setAttribute('value','none'); clr.classList.add('kspar-button','kspar-filter');
bar.append(clr); clr.addEventListener('click', clear);

let bal = document.createElement('a');  bal.id = "layout_balance"; bal.textContent = "Balance Chapters"; 
bal.setAttribute('value','bal'), bal.classList.add('kspar-button','kspar-layout');
bar.append(bal); bal.addEventListener('click', Balance);
let chap = document.createElement('select'); chap.id = 'layout_chapter'; chap.setAttribute('value','original'); chap.style.marginLeft = '10px';
chap.addEventListener('click', (e)=>{e.stopPropagation();}); chap.addEventListener('change', (e)=>{Balance(e);});
for (let r = 1; r < Roman.length; r++){
    let o = document.createElement('option'); o.value = r; o.textContent =Roman[r];
    chap.append(o);
}
bal.append(chap);

let res = document.createElement('a'); res.textContent = "Original Layout"; res.classList.add('kspar-button','kspar-layout','kspar-active');
bar.append(res); res.addEventListener('click', Restore);

const legend = document.createElement('div'); legend.id="rank_legend";
document.body.append(legend);

//Handle button presses and current status of filters & layouts
const Status = {
    _filter:null,
    get filter(){
        return this._filter;
    },
    set filter(f){
        if (f == this._filter) return;
        if (this._filter) this._filter.classList.remove('kspar-active');
        this._filter = f;
        if(f) f.classList.add('kspar-active');
    },
    _layout:res,
    get layout(){
        return this._layout;
    },
    set layout(l){
        if (l == this._layout) return;
        if (this._layout) this._layout.classList.remove('kspar-active');
        this._layout = l;
        if (l) l.classList.add('kspar-active');
    }
};

function hlON(e){// Highlight buildings of the same rank by dimming others
    const r = e.target.getAttribute('rank');
    for (let b of buildings.filter(b => b.node.getAttribute('rank') != r)){
        b.node.classList.add('rNull');
    }
    for (let k of Array.from(legend.querySelectorAll('pre')).filter(n => n.getAttribute('rank') != r)){
        k.classList.add('rNull');
    }
}
function hlOFF(){// Remove highlighting & restore visuals
    for (let b of buildings.filter(b => b.node.getAttribute('rank') != 'null')){
        b.node.classList.remove('rNull');
    }
    for (let k of legend.querySelectorAll('pre')){
        k.classList.remove('rNull');
    }
}

function parse(){// Populate buildings list with the current layout
    buildings = [];
    for (let b of Array.from(document.querySelectorAll('.building'))){
        let [title, params] = b.title.split('-');
        let tiles = +b.style.width.replace('px','') / 22 * +b.style.height.replace('px','') / 22;
        let pop = 0, cul = 0;
        if (params){
            pop = params.match(/[, || 0-9]+ Population/);
            cul = params.match(/[, || 0-9]+ Culture/);
        }
        let target = {
            'title':title,
            'tiles':tiles,
            'x': b.style.left,
            'y': b.style.top,
            'Culture':cul ? +cul[0].replace(/[Culture || ,]/g,'') / tiles : 0,
            'Population':pop ? +pop[0].replace(/[Population || ,]/g,'') / tiles : 0,
            'node':b,
        }
        if (b.querySelector('.chapter')){
            target.chapter = Roman.indexOf(b.querySelector('.chapter').textContent);
        } else if (b.querySelector('.stage')) {
            target.chapter = Roman.indexOf(b.querySelector('.stage').textContent.split('-')[0]);
        }
        buildings.push(target);
    }
    if (stored.length < 1){ // Stored needs to keep the initial layout, to be returned to on button press
        stored = buildings;
    }
}

function EA_Rank_Click(e){
    clear();
    Status.filter = e.target;
    const param = Status.filter.getAttribute('value');

    parse(); // Calling this ensures changes to the layout are considered 

    //Compile a list of critical buildings: must have value > 0, and only consider each building type once.
    const critical = buildings.sort((a, b) => b[param] - a[param])
        .filter(b => buildings.find(t => t.title == b.title && t[param] == b[param]) === b)
        .filter(b=> b[param] > 0);
    const ave = critical.reduce((a, b) => a + b[param], 0) / critical.length;
    const SumSqDiff = critical.reduce((a, b)=> a + (b[param] - ave) ** 2, 0);
    const StDiv = Math.sqrt(SumSqDiff / critical.length);

    let mark; // mark indicates where the mean line is located
    
    //Reset contents for the legend
    let lbl = document.createElement('p'); Object.assign(lbl.style, {textAlign:"center", color:'black', fontWeight:'bold', 
        padding:'5px', margin:'0px', 
        filter:'drop-shadow(white 0.3px 0.3px) drop-shadow(white 0 0 1px) drop-shadow(white 0 0 1px) drop-shadow(white 0 0 1px)',
    });
    lbl.textContent = `Rank - ${param} per tile (Ave: ${ave.toFixed(2)})`;
    legend.replaceChildren(lbl);

    let style = document.querySelector('#building_ranks');
    if (!style){ // Create Style element for ranked buildings
        style = document.createElement('style'); style.id = `building_ranks`;
        document.head.append(style);
    }
    style.textContent = `.rNull {
        filter: sepia() brightness(60%)
    }`;
    for (let i = 0; i < critical.length; i++){
        let value = critical[i][param]
        style.textContent += `
        .r${i} {
            font-weight: bold;
            position: absolute;
            border-radius: 4px;
            width: 100%;
            height: 100%;
            margin: 0;
            text-align: center;`;
        let Divs = (value - ave) / StDiv;
        if (Divs > 3){
            style.textContent += `
                color: black;
                background-color: color-mix(transparent 20%, green);`;
        } else if (Divs > 2){
            style.textContent += `
                color: black;
                background-color: color-mix(transparent 20%, lightgreen);`;
        } else if (Divs > 1) {
            style.textContent += `
                color: black;
                background-color: color-mix(transparent 20%, color-mix(lightgreen 50%, yellow));`;
        } else if (Divs > -1) {
            style.textContent += `
                color: black;
                background-color: color-mix(transparent 20%, yellow);`;
        } else if (Divs > -2) {
            style.textContent += `
                color: white;
                background-color: color-mix(transparent 20%, color-mix(goldenrod 50%, darkred));`;
        } else {
            style.textContent += `
                color: white;
                background-color: color-mix(transparent 20%, darkred);`;
        }
        style.textContent += '}';
        if (!mark && value < ave){//Average passed, add a top border to this key
            mark = true;
            style.textContent += `#rank_legend .r${i}{ border-top: 1px dashed;}`;
        }

        //Add a key to the legend
        let key = document.createElement('pre'); key.classList.add(`r${i}`); key.setAttribute('rank',i); key.title = critical[i].title; 
        key.textContent = `${i} - ${value.toLocaleString('en-AU', {maximumFractionDigits:2})}`;
        key.addEventListener('mouseenter', hlON); key.addEventListener('mouseleave',hlOFF);
        Object.assign(key.style, {height:'', position:'relative'});
        legend.append(key);
        
        //Create an overlay, and clone it to all the buildings of equal rank
        let r = document.createElement('pre'); r.id = "rank"; r.classList.add(`r${i}`, 'ranked');
        r.textContent = i; r.setAttribute('rank',i);
        for(let b of buildings.filter(b=> b.title == critical[i].title && b[param] == critical[i][param])){
            b.node.setAttribute('rank',i);
            let o = r.cloneNode(true); o.addEventListener('mouseenter', hlON); o.addEventListener('mouseleave', hlOFF);
            b.node.append(o);
        }
    }

    for (let b of buildings.filter(b=> b[param] == 0)){
        b.node.setAttribute('rank',null);
        b.node.classList.add('rNull');
    }
    let rect = legend.getBoundingClientRect();
    let bounds = document.body.getBoundingClientRect();
    Object.assign(legend.style, {
        scale:`${Math.min(1, (bounds.height - 15) / (rect.top + rect.height))}`
    });
}
function clear(){// Clear ranking
    Status.filter = null;
    for (let b of buildings){
        b.node.classList.remove('rNull');
        if(b.node.querySelector('#rank')) b.node.removeChild(b.node.querySelector('#rank'));
    }
    legend.replaceChildren();
}

function Balance(e){
    e.preventDefault();
    Status.layout = document.querySelector('#layout_balance');
    parse();
    for (let b of buildings.filter(b => b.chapter)){
        rebuild(b, document.querySelector('#layout_chapter').value);
    }
    if (Status.filter) Status.filter.click();
}

function Restore(e){
    e.preventDefault();
    Status.layout = e.target;
    parse();
    for (let b of buildings.filter(b => b.chapter)){
        let s = stored.find(s => s.x == b.x && s.y == b.y);
        rebuild(b, s.chapter);
    }
    if (Status.filter) Status.filter.click();
}
function rebuild(target, chapter){
    if (target.chapter){
        target.node.dispatchEvent(new Event('contextmenu', {bubbles:true}));
        document.querySelector(`[data-value="${target.node.getAttribute('data-base-name')}_${chapter}"]`).click();
        let node = document.querySelector('.building.builder');
        Object.assign(node.style, {left:target.x, top:target.y});
        node.classList.remove('builder');
        plannerEditor.dispatchEvent(new Event('stopbuild', {bubbles:true}));
        target.node = node;
    }
}
