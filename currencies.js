'use strict';

 let DefaultProperties = {
    assign: function (conf, opts) {
        conf = conf || {};
        opts = opts || {};

        conf.servUrl = "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/";
        conf.year = opts.year || 'latest';
        conf.default = opts.default || 'usd';
        conf.filter =  opts.filter ||  null;
        return conf;
    }
};

let Currencies = function (elem, opts) {
    let me = this;
    let hasMultipleElements = false;

    if (typeof elem === 'string') {
        me.elem = document.querySelector(elem);
        hasMultipleElements = document.querySelectorAll(elem).length > 1;
    } else {
      if (typeof elem.length !== 'undefined' && elem.length > 0) {
        me.elem = elem[0];
        hasMultipleElements = elem.length > 1;
      } else {
        me.elem = elem;
      }
    }

    if (!me.elem) {
        throw new Error('[Currencies.js] Error : elem');
    }

    if (hasMultipleElements) {
      try {
        console.warn('[Currencies.js] Warning : Multiple input');
      } catch (e) {
        
      }
    }

    opts.initValue = me.elem.value;
    me.properties = DefaultProperties.assign({}, opts);
    me.init();
};

Currencies.prototype = {
    init: function () {
       let me = this, prop = me.properties;
       me.onChangeListener = me.onChange.bind(me);
       me.elem.addEventListener('input', me.onChangeListener);
       me.displayCurrencies();

    },
    onChange: function (event) {
        let me = this;
        me.properties.default = this.elem.value;
        console.log(this.elem.value);
        me.displayRates();
        document.getElementById('currencies-datatable').remove();
    },
    displayCurrencies: async function () {
        let me = this, prop = me.properties;

        if(prop.filter == null){
            me.properties.filter = Object.keys(res);
            prop = me.properties;
        }

        me.elem.innerHTML = '<option>Loading..</option>';
        me.elem.setAttribute("disabled", "");

        const res = await me.fetchCurrencies();

        me.elem.innerHTML = '';
        me.elem.removeAttribute("disabled");

        for (const fil of prop.filter ){

            if (res.hasOwnProperty( fil )) {
                let el_op = document.createElement('option');
                el_op.textContent = res[fil];
                el_op.setAttribute("value", fil);
                
                if( fil == prop.default){
                    el_op.setAttribute("selected", "");
                }
                me.elem.appendChild(el_op);
            }
            
        }
        console.log(res);
        me.displayRates();
    },
    fetchCurrencies : async function () {
        let me = this, prop = me.properties;
        let url = prop.servUrl+prop.year+"/currencies.json"; 
        return await (await fetch( url )).json();
    },
    displayRates : async function (cur = null) {
        let me = this, prop = me.properties;

        if (cur === null){
            cur = me.properties.default;
        }

        let reqs = [];
        let rates1 = [], rates2 = [], rates3 = [];
        
        for (const fil of prop.filter ){
            if( cur != fil) {
                reqs.push( {"from": cur, "to": fil, "url": prop.servUrl+prop.year+"/currencies/"+cur+"/"+fil+".json"} );
                reqs.push( {"from": fil, "to": cur, "url": prop.servUrl+prop.year+"/currencies/"+fil+"/"+cur+".json"} );
            }
        }

        //Group 1 - all exchange rates that are < 1
        //Group 2 - all exchange rates that are >= 1 and < 1.5
        //Group 3 - all exchange rates that are >= 1.5
        await reqs.reduce( async (acm, req) => {
            await acm;
            const exchangeRate = await me.fetchExchangeRate(req);
            me.writeCache(exchangeRate.url, exchangeRate.data);
            
            if(exchangeRate.data[exchangeRate.to] < 1){
                rates1.push([exchangeRate.from+"-"+exchangeRate.to, exchangeRate.data[exchangeRate.to] ]);
            }else if(exchangeRate.data[exchangeRate.to] >= 1 && exchangeRate.data[exchangeRate.to] < 1.5){
                rates2.push([exchangeRate.from+"-"+exchangeRate.to, exchangeRate.data[exchangeRate.to] ]);
            }else{
                rates3.push([exchangeRate.from+"-"+exchangeRate.to, exchangeRate.data[exchangeRate.to] ]);
            }
        }, Promise.resolve());

        rates1.sort((a,b) => a[1] - b[1]);
        rates2.sort((a,b) => a[1] - b[1]);
        rates3.sort((a,b) => a[1] - b[1]);

        let ratesAll  = rates1.concat(rates2, rates3);
        console.log(ratesAll);
        let tempSize = 1;

        for (let i = 0; i < ratesAll.length; i++) {
            let pairA = ratesAll[i][1], pairB = ratesAll[i][1];
            for (let j = i + 1; j < ratesAll.length; j++) {
                if (ratesAll[j][1] < pairA){ pairA = ratesAll[j][1];}
                if (ratesAll[j][1] > pairB){ pairB = ratesAll[j][1];}
                if (Math.abs(pairB - pairA) <= 0.5) {
                    let size = j - i + 1;
                    if (tempSize < size){ tempSize = size; }   
                }
            }
        }

        let group1_div = '';
        for (let i = 0; i < rates1.length; i++) {
            group1_div +='<div id="'+rates1[i][0]+'" class="font-italic">'+rates1[i][0]+" "+rates1[i][1]+'</div>';
            if(i == rates1.length-1){
                group1_div +='<div class="font-italic count-'+cur+'-'+'group1'+'">Count: '+(i+1)+'</div>';
            }
        }

        let group2_div = '';
        for (let i = 0; i < rates2.length; i++) {
            group2_div +='<div id="'+rates2[i][0]+'" class="font-italic">'+rates2[i][0]+" "+rates2[i][1]+'</div>';
            if(i == rates2.length-1){
                group2_div +='<div class="font-italic count-'+cur+'-'+'group2'+'">Count: '+(i+1)+'</div>';
            }
        }

        let group3_div = '';
        for (let i = 0; i < rates3.length; i++) {
            group3_div +='<div id="'+rates3[i][0]+'" class="font-italic">'+rates3[i][0]+" "+rates3[i][1]+'</div>';
            if(i == rates3.length-1){
                group3_div +='<div class="font-italic count-'+cur+'-'+'group3'+'">Count: '+(i+1)+'</div>';
            }
        }
        
        

        let el_div = document.createElement('div');
        let th = '<thead><tr><th scope="col">Group 1</th><th scope="col">Group 2</th><th scope="col">Group 3</th></tr></thead>';
        let tb = '<tbody><tr><td scope="col">'+group1_div+'</td><td scope="col">'+group2_div+'</td><td scope="col">'+group2_div+'</td></tr></tbody>';
        el_div.innerHTML = '<table class="table">'+th+tb+'</table><div class="length " >length: '+tempSize+'</div>';
        el_div.setAttribute("id", "currencies-datatable");
        me.elem.parentElement.appendChild(el_div);
        
    },
    fetchExchangeRate : async function(obj){
        let me = this;
        let from = obj.from;
        let to = obj.to;
        let url = obj.url;

        let date = new Date();
        let year = date.getFullYear();
        let month = date.getMonth()+1;
        let dt = date.getDate();

        if (dt < 10) {dt = '0' + dt;}
        if (month < 10) {month = '0' + month;}

        try{
        if(me.readCache(url).date == year+'-' + month + '-'+dt){
            console.log("loading from storage");
            let data = me.readCache(url).data;
            return { url, from, to, data  }
        }}catch{}
        //console.log(me.readCache(url).date);

        return await (await fetch(url)).json().then((data) => ({ url, from, to, data  }));
    },
    destroy: function () {
        let me = this;
        me.elem.removeEventListener('input', me.onChangeListener);
    },
    writeCache: function (url, data) {
        return localStorage.setItem(url, JSON.stringify(data));
    },
    readCache: function (url) {
        return JSON.parse(localStorage.getItem(url)) || null
    },    
    toString: function () {
        return '[Currencies Object]';
    }
};





  