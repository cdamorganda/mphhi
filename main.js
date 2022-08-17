window.addEventListener('DOMContentLoaded', (e) => {
    
    let currencies = new Currencies('#currencies', {
        year:'latest',
        default:"usd",
        filter: [ "eur", "aud", "cad","usd", "chf", "nzd", "bgn" ]
    });

});

