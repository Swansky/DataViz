const E95 = "95 E10";
const E98 = "98 E10";
const DIESEL = "Gazole";
const ELEC = "Elec";
const E85 = "E85"

const carStats = [
    {name: "Tesla Model S", conso: 17.5, type: ELEC}, // 17.5 kWh/100km
    {name: "Renault Zoé", conso: 16.5, type: ELEC}, // 16.4 kWh/100km
    {name: "Peugeot 208", conso: 5.4, type: E95}, // 5.4 l/100km
    {name: "Peugeot 308", conso: 5, type: DIESEL}, // 5.0 l/100km
    {name: "Citroën C3", conso: 4.7, type: E95}, // 4.7 l/100km
    {name: "Audi RS6", conso: 14.3, type: E85}, // 14.3 l/100km
    {name: "Porsche 911", conso: 12.7, type: E98}, // 12.7 l/100km
    {name: "Mercedes EQS Berline", conso: 17.3, type: ELEC}, // 17,3 kWh/100km
    {name: "Ferrari F40", conso: 12.4, type: E98}, // 12.4 l/100km
    {name: "Ford Fiesta", conso: 6.0, type: E85}, // 6.0 l/100km
    {name: "Porsche Taycan Turbo S ST", conso: 24.0, type: ELEC}, // 24.0 kWh/100km
]

async function main() {
    const data = await computeData();
    await createMainGraph(data);
    await createCarConsoGraph(data);
}

async function computeData() {
    return await d3.csv("data/global_prices.csv", (data) => {
        return {
            date: d3.timeParse("%Y-%m")(data.date),
            prix95E10: parseFloat(data.prix95E10),
            prix98: parseFloat(data.prix98E10),
            prixGazole: parseFloat(data.prixGazole),
            prixElec: parseFloat(data.prixElec),
            prixE85: parseFloat(data.prixE85)
        };
    });
}

function createDataForCar(initData) {

    let lastPrices = initData[0];

    function convertTypeForCsvColumn(type) {
        switch (type) {
            case E95:
                return "prix95E10";
            case E98:
                return "prix98";
            case DIESEL:
                return "prixGazole";
            case ELEC:
                return "prixElec";
            case E85:
                return "prixE85";
            default:
                return "";
        }
    }

    return carStats.map((d) => {
        return {
            name: d.name + " (" + d.type + ")",
            priceFor100Km: d.conso * lastPrices[convertTypeForCsvColumn(d.type)],
        }
    });
}

async function createMainGraph(data) {

    const width = 900;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 60;



    const x = d3.scaleUtc()
        .domain([data[data.length - 1].date, data[0].date])
        .range([marginLeft, width - marginRight]);


    const y = d3.scaleLinear()
        .domain([0, data.reduce((max, d) => Math.max(max, d.prix95E10, d.prix98, d.prixGazole, d.prixElec), 0)])
        .range([height - marginBottom, marginTop]);


    const svg = d3.create("svg")
        .attr("width", width + 200)
        .attr("height", height);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    const line_95 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.prix95E10));

    const line_98 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.prix98));

    const line_gazole = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.prixGazole));

    const line_elec = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.prixElec));

    const line_E85 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.prixE85));


    let legendData = [
        {label: "95E10", color: "#5DABEB"},
        {label: "98E10", color: "#82CEEB"},
        {label: "Diesel", color: "#CEA3EA"},
        {label: "Elec domicile", color: "#818AEB"},
        {label: "E85", color: "#81EBC3"}
    ];


    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#5DABEB")
        .attr("stroke-width", 3)
        .attr("d", line_95(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#82CEEB")
        .attr("stroke-width", 3)
        .attr("d", line_98(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#CEA3EA")
        .attr("stroke-width", 3)
        .attr("d", line_gazole(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#818AEB")
        .attr("stroke-width",3)
        .attr("d", line_elec(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "#81EBC3")
        .attr("stroke-width", 3)
        .attr("d", line_E85(data));


    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(900, 1)");


    legendData.forEach(function (d, i) {
        let legendItem = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendItem.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", d.color);

        legendItem.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d.label);
    });

    containerMainGraph.append(svg.node());
}


async function createCarConsoGraph(initData) {
    const data = createDataForCar(initData);
    data.sort((a, b) => b.priceFor100Km - a.priceFor100Km);

    const margin = {top: 20, right: 30, bottom: 40, left: 170},
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    const svg = d3.select("#containerCarGraph")
        .append("svg")
        .attr("width", 1100)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, function (d) {
            return d.priceFor100Km;
        })])
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
    const format = x.tickFormat(20, ".2f");


    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.name))
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))

    svg.selectAll("myRect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.priceFor100Km))
        .attr("height", y.bandwidth())
        .attr("fill", "#82CEEB");

    svg.append("g")
        .attr("fill", "white")
        .attr("text-anchor", "end")
        .selectAll()
        .data(data)
        .join("text")
        .attr("x", (d) => x(d.priceFor100Km))
        .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text((d) => format(d.priceFor100Km) + " €");

    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(530, 100)");
    let lastData = initData[0];
    let legendData = [
        {label: "95E10", price: lastData.prix95E10},
        {label: "98E10", price: lastData.prix98},
        {label: "Diesel", price: lastData.prixGazole},
        {label: "Elec domicile", price: lastData.prixElec},
        {label: "E85", price: lastData.prixE85},

    ];


    legendData.forEach(function (d, i) {
        let legendItem = legend.append("g")
            .attr("transform", `translate(0, ${i * 30})`);

        legendItem.append("text")
            .attr("x", 10)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d.label );
        legendItem.append("text")
            .attr("x", 120)
            .attr("y", 9)
            .attr("dy", ".35em")
            .text(d.price + " €");
    });

}


main().catch(console.error);