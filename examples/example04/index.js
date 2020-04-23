module.exports = (Handlebars) => {
    Handlebars.registerHelper('sum', function (val1, val2) {
        return Number(val1) + Number(val2);
    });

    Handlebars.registerHelper('concat', function (val1, val2) {
        return val1 + val2;
    });

    Handlebars.registerHelper('autor', function (val1, val2) {
        return "Ferreiro";
    });
}