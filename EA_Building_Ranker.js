var buildings = [];
const buttons = [];
const key = document.createElement('div'); Object.assign(key.style, {display:"flex", flexFlow:"column", width:'150px'});
document.body.append(key);
function parse(){
    buildings = [];
    for (let b of Array.from(document.querySelectorAll('.building'))){
        let [title, params] = b.title.split('-');
        let tiles = +b.style.width.replace('px','') / 22 * +b.style.height.replace('px','') / 22;
        let pop = 0, cul = 0;
        if (params){
            pop = params.match(/[,||0-9]+ Population/);
            cul = params.match(/[,||0-9]+ Culture/);
        }
        let target = {
            'title':title,
            'tiles':tiles,
            'Culture':cul ? +cul[0].replace(' Culture','').replace(/,/g,"") / tiles : 0,
            'Population':pop ? +pop[0].replace(' Population','').replace(/,/g,"") / tiles : 0,
            'nodes':[b],
        }
        if (!oFind(buildings, target)){
            buildings.push(target);
        } else if (!oFind(buildings, target).nodes.includes(b)) { oFind(buildings, target).nodes.push(b)}
    }
}
function oMatch(o1, o2){
    for (let [key, val] of Object.entries(o1)){
        if (key != 'nodes' && o2[key] != val) return false;
    }
    for (let [key, val] of Object.entries(o2)){
        if (key != 'nodes' && o1[key] != val) return false;
    }
    return true;
}
function oFind(arr, o1){
    for (let o2 of arr){
        if (oMatch(o1, o2)) return o2;
    }
    return undefined;
}
function EA_Rank_Click(e){
    clear();
    const param = e.target.className;
    e.target.style.color = 'yellow';
    parse();
    buildings.sort((a, b) => b[param] - a[param]);
    const critical = buildings.filter(b => b[param] > 0);
    const max = buildings[0][param];
    const min = critical.slice(-1)[0][param];
    const med = Math.floor(critical.length / 2);
    const ave = critical.reduce((a, b) => a + b[param], 0) / critical.length;
    const SumSqDiff = critical.reduce((a, b)=> a + (b[param] - ave) ** 2, 0);
    const StDiv = Math.sqrt(SumSqDiff / critical.length);
    const values = [];
    for (let i = 0; i < buildings.length; i++){
        let v = {'value':buildings[i][param], 'rank':i, node:{}, 'style':{
            color:'black', 
            display:'inline-block !important', fontWeight:'bold',
            position:'absolute', borderRadius:'4px', width:'100%', height:'100%', textAlign:'center',
        }};
        if (v.value > 0){
            let Divs = (v.value - ave) / StDiv;
            if (Divs > 2){
                v.style.backgroundColor = `color-mix(transparent 20%, lightgreen)`;
            } else if (Divs > 1){
                v.style.backgroundColor = `color-mix(transparent 20%, color-mix(lightgreen 50%, yellow))`;
            } else if (Divs > 0){
                v.style.backgroundColor = `color-mix(transparent 20%, yellow)`;
            } else if (Divs > -1){
                v.style.backgroundColor = `color-mix(transparent 20%, color-mix(goldenrod 50%, darkred))`;
                v.style.color = 'white';
            } else {
                v.style.backgroundColor = `color-mix(transparent 20%, darkred)`;
                v.style.color = 'white';
            }
            /*if (v.value >= buildings[med][param]){
                const rate = (v.value - buildings[med][param]) / (max - buildings[med][param]);
                v.style.backgroundColor = `color-mix(transparent 20%, color-mix(lightgreen ${rate * 100}%, yellow))`;
            } else {
                const rate = (v.value - min) / (buildings[med][param] - min);
                v.style.backgroundColor = `color-mix(transparent 40%, color-mix(goldenrod ${rate * 100}%, darkred))`;
                v.style.color = 'white';
            }*/
        } else {
            v.rank = "";
            v.style = {};
            v.node = {filter:'sepia() brightness(60%)'};
        }
        values.push(v);
        let r = document.createElement('pre'); r.id = "rank";
        r = document.createElement('pre'); r.id = "rank";
        Object.assign(r.style, v.style);
        r.textContent = v.rank;
        for (node of buildings[i].nodes){
            if (v.value > 0){
                node.append(r.cloneNode(true));
            }
            Object.assign(node.style, v.node);
        }
    }
    let lbl = document.createElement('pre'); Object.assign(lbl.style, {textAlign:"center", color:'black', fontWeight:'bold', 
        padding:'5px', margin:'0px', 
        filter:'drop-shadow(white 0.3px 0.3px) drop-shadow(white 0 0 1px) drop-shadow(white 0 0 1px) drop-shadow(white 0 0 1px)',
    });
    lbl.textContent = `Rank - ${param} per tile (Ave: ${ave.toFixed(2)})`;
    key.append(lbl);
    let mark;
    key.append(...values.filter(i => i.value > 0).map((v) => {
        let Divs = Math.floor((v.value - ave) / StDiv);
        let d = document.createElement('pre'); Object.assign(d.style, v.style);
        d.textContent = `${v.rank} - ${v.value.toFixed(2)}`;
        d.style.height = ""; d.style.position = "relative"; d.style.margin = '0px';
        return d;
    }));
    let rect = key.getBoundingClientRect();
    Object.assign(key.style, {
        transformOrigin:'top left', scale:`${Math.min(1, (window.innerHeight - 45) / (rect.top + rect.height))}`
    });
    console.log(buildings);
}
function clear(){
    for (let b of buttons){
        b.style.color = "";
    }
    for (let b of buildings){
        for (let node of b.nodes){
            node.style.filter = "";
            node.replaceChildren(...Array.from(node.children).slice(0, 2));
        }
    }
    key.replaceChildren();
}
let a = document.createElement('a'); a.id = 'culture_calc'; a.textContent = "Culture Ranking"; a.classList.add('Culture');
document.body.append(a);
a.addEventListener('click', EA_Rank_Click);
let p = document.createElement('a'); p.id = 'pop_calc'; p.textContent = "Population Ranking"; p.classList.add('Population');
document.body.append(p);
p.addEventListener('click', EA_Rank_Click);
let clr = document.createElement('a'); clr.textContent = "Clear Ranking";
document.body.append(clr);
clr.addEventListener('click', clear);
buttons.push(a, p, clr, key);
let y = 45;
for (let i of buttons){
    Object.assign(i.style, {position:'fixed', left:'15px', top:`${y}px`});
    if (i.constructor.name == "HTMLAnchorElement") i.style.cursor = "pointer";
    y += 30;

}

