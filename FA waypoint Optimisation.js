const icons = {};
const info = document.querySelector('#left_bar');
const Maps = {};
Score = {
    active: 10,
    elite: 8,
    devout: 2,
    workshops: 5,
    workshops2: 5,
    manufactories: 5,
    manufactories2: 5,
    update(){
        this.active = document.querySelector('#opt_input_active').valueAsNumber;
        this.elite = document.querySelector('#opt_input_elite').valueAsNumber;
        this.devout = document.querySelector('#opt_input_devout').valueAsNumber;
        this.workshops = document.querySelector('#opt_input_workshops').valueAsNumber;
        this.manufactories = document.querySelector('#opt_input_factories').valueAsNumber;
        this.workshops2 = document.querySelector('#opt_input_extra_workshops').valueAsNumber;
        this.manufactories2 = document.querySelector('#opt_input_extra_factories').valueAsNumber;
        localStorage.FA_opt = JSON.stringify(this);
    },
    balance(high, low, cat = this.elite){
        let prop = cat / this.active;
        return high * prop + low * (1 - prop);
    },
    Supplies(tally){
        let {active, workshops, workshops2, devout} = this;
        let brew = tally["Dwarven Brewery Badge"] * 25 * 0.08;
        let carp = tally["Carpenters Guild Badge"] * 10 * 3;
        let farm = tally["Farmers Guild Badge"] * 10 * 9;
        let black_high = (tally["Blacksmith Guild Badge"] * 5 - workshops - workshops2) * 24;
        let black_low = (tally["Blacksmith Guild Badge"] * 5 - workshops) * 24;
        let high = (brew + carp + farm + black_high) / (workshops + workshops2);
        let low = (brew + carp + farm + black_low) / workshops;
        return this.balance(high, low, devout) / active;
    },
    Goods(tally){
        let {active, manufactories, manufactories2, devout} = this;
        let brac = 0;
        let neck = tally["Diamond Necklace"] * 4 * 24;
        let stat_high = (tally["Elegant Statue"] * 2 - manufactories - manufactories2) * 48;
        let stat_low = (tally["Elegant Statue"] * 2 - manufactories) * 48;
        let high = (brac + neck + stat_high) / (manufactories + manufactories2);
        let low = (brac + neck + stat_low) / manufactories;
        return this.balance(high, low, devout) / active;
    },
    Magic(tally){
        let {active, elite} = this;
        let ench = Math.max(tally["Witch Hat"] * 2, tally["Enchanted Tiara"] * 3);

        let high = Math.max(
            ench * 4 + (tally["Druid Staff"] * 2 - 5) * 6,
            tally["Recycled Potion"] * 24,
            tally["Arcane Residue"] * 24 / 1.3,
        );
        let low = Math.max(
            ench * 13 + (tally["Druid Staff"] * 2 - 2) * 19.5,
            tally["Recycled Potion"] * 24,
            tally["Arcane Residue"] * 24 / 1.3,
        );
        return this.balance(high, low, elite) / active;
    },
    Military(tally){
        let {active, elite} = this;
        let guard = tally["Elvarian Guard Badge"] * 4 * 5;
        let ghost = tally["Ghost in a bottle"] * 24/2 * active / elite;
        return Math.max(guard, ghost) / active;
    },
    Other(tally){
        let {active, elite} = this;
        let wonder = tally["Wonder Society Badge"] * 20 * active / elite;
        let coin = 0;
        return Math.max(wonder, coin) / active;
    },
    final(tally){
        return Math.max(this.Supplies(tally), this.Goods(tally), this.Magic(tally), this.Military(tally), this.Other(tally));
    }
};


class node{
    constructor(cell){
        this.cells = [cell.previousElementSibling, cell, cell.nextElementSibling];
        this.keeper = this.cells[0].querySelector(`#opt_timestep`);
        if (!this.keeper){
            this.keeper = document.createElement('div'); 
            this.keeper.id = 'opt_timestep';
            this.cells[0].append(this.keeper);
        }

        this["Dwarven Brewery Badge"] = 0;
        this["Carpenters Guild Badge"] = 0;
        this["Farmers Guild Badge"] = 0;
        this["Blacksmith Guild Badge"] = 0;

        this["Golden Bracelet"] = 0;
        this["Diamond Necklace"] = 0;
        this["Elegant Statue"] = 0;

        this["Witch Hat"] = 0;
        this["Enchanted Tiara"] = 0;
        this["Druid Staff"] = 0;
        this["Recycled Potion"] = 0;

        this["Elvarian Guard Badge"] = 0;
        this["Ghost in a bottle"] = 0;

        this["Sack of Coins"] = 0;
        this["Wonder Society Badge"] = 0;
        this["Arcane Residue"] = 0;

        let badges = Array.from(cell.querySelectorAll('img'));
        let count = cell.textContent.split('x ').filter(x => x != "").map(x => +x);
        for (let i = 0; i < badges.length; i++){
            this[badges[i].title] += count[i];
        }
    }
}

class route{
    get cells(){
        let result = [];
        for (let n of this.nodes){
            result.push(...n.cells);
        }
        return result;
    }
    constructor(number){
        this.nodes = [];
        this.nodes.push(new node(document.querySelector(`#td_${number}_all_1`)));
        for (let n of Array.from(document.querySelectorAll(`[id^="td_${number}_${this.constructor.name.toLowerCase()}"]`))){
            this.nodes.push(new node(n));
        }
    }
    get colour(){return this.constructor.name;}
    get shade(){return `color-mix(in srgb, ${this.colour} 80%, black 20%)`;}
}

class Orange extends route{}
class Blue extends route{}
class Green extends route{}

class Map{
    get table(){
        return document.querySelectorAll('.bbTable')[this.number - 1];
    }
    get start(){
        return document.querySelector(`#td_${this.number}_all_1`);
    }
    get best(){
        if (this.override){
            return this[this.override];
        }
        return this._best;
    }
    get _best(){
        let min = Math.min(
            Score.final(Combine(this.orange.nodes)), 
            Score.final(Combine(this.green.nodes)), 
            Score.final(Combine(this.blue.nodes))
        );
        return [this.orange, this.blue, this.green].find(x => Score.final(Combine(x.nodes)) == min);
    }
    constructor(number){
        this.override = undefined;
        this.number = number;
        this.orange = new Orange(number);
        this.blue = new Blue(number);
        this.green = new Green(number);
        this.build();
    }
    async build(){
        while(!this.start){
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        let {table, number} = this;
        this.orange = new Orange(number);
        this.blue = new Blue(number);
        this.green = new Green(number);

        this.Opt();
    }
    Opt(){
        let {table, number, orange, blue, green} = this;

        let lab = document.querySelector(`#opt_pick_${number}`);
        if (!lab){
            lab = document.createElement('h3'); lab.id = `opt_pick_${number}`;
            let c = document.createElement('div');
            c.style.textAlign = "center";
            c.append(lab);
            let fieldset = table.previousElementSibling.querySelector('fieldset').parentElement;
            fieldset.querySelector(`#calculate_${this.best.constructor.name.toLowerCase()}_${number}`).click();
            fieldset.append(c);
        }
        lab.textContent = `Best Path: ${this._best.constructor.name}`; lab.style.color = this._best.shade;

        for (let p of [orange, blue, green]){
            let tally = Combine(p.nodes);
            
            for (let i = 1; i < number; i++){
                tally = Combine(Maps[`m${i}`].best.nodes, tally);
            }
            let s = Score.final(tally);
            let cs = document.querySelector(`#opt_score_${p.colour}_${number}`);
            if (!cs){
                cs = document.createElement('span'); cs.id = `opt_score_${p.colour}_${number}`;
                cs.style.color = p.shade; cs.style.paddingLeft = '15px';
                
                let c = Array.from(table.querySelectorAll('th')).find(s => s.textContent == p.colour);
                c.append(cs);
            }
            cs.textContent = Time(s); 
        }
        for (let path of [orange, blue, green]){
            for (let node of path.nodes){
                node.keeper.textContent = "";
                for (let cell of node.cells){
                    cell.style.filter = "grayscale(1)";
                }
            }
        }
        for (let cell of this.best.cells){
            cell.style.filter = "none";
        }

        if (!info.querySelector('#opt_timeline')){
            let tim = document.createElement('div');
            tim.id = 'opt_timeline';
            tim.classList.add('text-link','font-weight-bold');
            tim.style = 'text-decoration:underline;';
            tim.textContent = "Timeline";
            info.append(tim);
            for (let map of [1, 2, 3]){
                let t = document.createElement('div'); t.id = `opt_timeline_${map}`;
                t.classList.add('text-link');
                t.style = "font-weight:bold; padding-left: 15px;";
                info.append(t);
            }
        }
        for (let map of [Maps.m1, Maps.m2, Maps.m3]){
            if (map){
                let {number} = map;
                let t = info.querySelector(`#opt_timeline_${number}`);
                let tally = {};
                for (let i = 1; i < map.number; i++){
                    tally = Combine(Maps[`m${i}`].best.nodes, tally);
                }
                for (let i = 0; i < map.best.nodes.length; i++){
                    let halfTally = Combine(map.best.nodes.slice(0, i + 1), tally);
                    let step =  Score.final(halfTally);
                    map.best.nodes[i].keeper.textContent = Time(step);
                }
                tally = Combine(map.best.nodes, tally);
                t.textContent = Time(Score.final(tally));
            }
        }
    }
}

function Combine(nodes, init = {}){
    let tally = Object.assign({}, init);
    for (let node of nodes){
        for (let [key, value] of Object.entries(node)){
            if (tally[key]) tally[key] += value; else tally[key] = value;
        }
    }
    return tally;
}

function Time(hrs){
    let time = (6 * 24) - hrs;
    let sign = time < 0 ? '-' : '';
    let days = Math.trunc(Math.abs(time) / 24);
    let hours = Math.trunc(Math.abs(time) - days * 24);
    let minutes = Math.trunc((Math.abs(time) - days * 24 - hours) * 60);
    if (days > 0)  return `${sign}${days}d ${hours}h ${minutes}m`;
    if (hours > 0)  return `${sign}${hours}h ${minutes}m`;
    return `${sign}${minutes}m`;
}

async function Execute(){
    if (window.location.hash == "#waypoints"){
        InitialAlert();
        while(info.children.length < 1){
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        info.style.height = 'fit-content'; info.style.marginTop = '200px'; info.style.gap = '15px'; 
        info.style.display = 'flex'; info.style.flexFlow = 'column'; info.style.justifyContent = 'space-evenly';
        if (!info.querySelector('#opt_title')){
            buildInput();
        }

        Maps['m1'] = new Map(1);
        Maps['m2'] = new Map(2);
        Maps['m3'] = new Map(3);
        for (let path of ["orange","blue","green"]){
            for (let map of [Maps.m1, Maps.m2, Maps.m3]){
                document.querySelector(`#calculate_${path}_${map.number}`).addEventListener('change', ()=>{
                    map.override = path;
                    map.Opt();
                });
            }
        }
    }
}

function buildInput(){
    let tit = document.createElement('div');
    tit.id = 'opt_title';
    tit.classList.add('text-link', 'font-weight-bold');
    tit.style = 'text-decoration:underline;';
    tit.textContent = "Optimisation";
    info.append(tit);
    let init = Score;
    if (localStorage.FA_opt){
        init = JSON.parse(localStorage.FA_opt)
    }
    for (let [label, p] of Object.entries({
            'Active Players: ':{id:"opt_input_active", value:init.active, min:1, max:25},
            'Elites: ':{id:"opt_input_elite", value:init.elite, min:1, max:25},
            'Devout: ':{id:"opt_input_devout", value:init.devout, min:0, max:25},
            'Shops: ':{id:"opt_input_workshops", value:init.workshops, min:1, max:99},
            '+: ':{id:"opt_input_extra_workshops", value:init.workshops, min:1, max:99},
            'Factories: ':{id:"opt_input_factories", value:init.manufactories, min:1, max:99},
            ' +: ':{id:"opt_input_extra_factories", value:init.manufactories, min:1, max:99}
        })){
        let al = document.createElement('label'); al.classList.add('text-link'); info.append(al);
        if (p.id.includes('extra')){
            al.previousElementSibling.append(al);
        }
        al.textContent = label; al.style.textAlign = 'right';
        let act = document.createElement('input'); act.id = p.id; al.append(act);
        sAtt(act, {'type':'number', 'value':p.value, 'min':p.min, 'max':p.max});
        act.addEventListener('change', ()=>{
            Score.update();
            Maps.m1.Opt(); Maps.m2.Opt(); Maps.m3.Opt();
        });
    }
}

function sAtt(el, att = {}){
    for (let [key, val] of Object.entries(att)){
        el.setAttribute(key, val);
    }
}

async function InitialAlert(){
    while (!document.querySelector('#event_banner')){
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    let msg = document.querySelector('#opt_message');
    if (!msg){
        msg = document.createElement('div'); msg.id = "opt_message";
        document.querySelector('#event_banner').nextElementSibling.append(msg);
        msg.style.cursor = "pointer"; msg.style.width = '100%';
        msg.addEventListener('click', ()=>{
            for (let child of Array.from(msg.children).slice(1)){
                if (child.style.display == "") child.style.display = "none"; else child.style.display = "";
            }
        });
    }
    let content = [];
    let p = document.createElement('pre'); p.style.textAlign = 'center'; p.style.fontWeight = "bold"; p.style.fontSize = "24px";
    p.textContent = `Kspar's Optimiser is now Active`;
    content.push(p);
    for(let block of [`<- Inputs are this way`,
        `<strong>Active Players:</strong><br>number of members contributing to the current FA.`,
        `<strong>Elites:</strong><br>members at or above chapter 5, with a level 5 Magic Academy<br>These members are better suited to MA badges, and are the only ones with access to wonders / ghosts in bottles.`,
        `<strong>Devout:</strong><br>members contributing excess tiles to workshops / manufactories.<br>Lower level players generally have access to more free space / population.`,
        `<strong>Shops:</strong><br>average number of workshops per member + average extra workshops provided by the devout`,
        `<strong>Factories:</strong><br>average manufactory pairs per member + average extra pairs provided by the devout`,
        `<strong>Timeline:</strong><br>shows the cumulative time to finish each selected map. The times at the top of each map table is the predicted time to finish just that map segment, and the timesteps at each node are also cumulative, from start to finishing that node.`,
        `Set inputs should be preserved after the browser is closed & reopened, as well as the badge tracker.`,
        `Remember, if using the optimiser with multiple members, to synchronise your input values.`,
        `For some reason, Map 3 has trouble on the first load. toggling any value up & down fixes this.`,
        `Optimiser will ignore selecting "all paths" for any map, but that's more of an endgame issue.`,
        `Click this section to compress / expand.`
    ]){
        let p = document.createElement('pre'); p.style.fontSize = "12px"; 
        p.style.whiteSpace = "pre-wrap"; p.style.textIndent = "-15px"; p.style.paddingLeft = "15px";
        p.innerHTML = block; p.style.display = localStorage.FA_opt ? "none" : "";
        content.push(p);
    }
    msg.replaceChildren(...content);
    if (!localStorage.FA_opt){
        localStorage.FA_opt = JSON.stringify(Score);
    }
}

Execute();

window.addEventListener('hashchange', (e)=>{
    Execute();
});
