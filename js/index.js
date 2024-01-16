const E95 = "95 E10";
const E98 = "98 E10";
const DIESEL = "Gazole";
const ELEC = "Elec";
const E85 = "E85"

const carStats = [
    {name: "Tesla Model S", conso: 17.5, type: ELEC}, // 17.5 kWh/100km
    {name: "Renault Zoé", conso: 15.7, type: ELEC}, // 15.7 kWh/100km
    {name: "Peugeot 208", conso: 5.6, type: E95}, // 5.6 l/100km
    {name: "Peugeot 308", conso: 5.2, type: DIESEL}, // 5.2 l/100km
    {name: "Citroën C3", conso: 4.7, type: E85}, // 5.6 l/100km
    {name: "Audi RS6", conso: 14.3, type: E85}, // 14.3 l/100km
    {name: "Porsche 911", conso: 12.7, type: E98}, // 12.7 l/100km
    {name: "Mercedes EQS Berline", conso: 17.3, type: ELEC}, // 17,3 kWh/100km
    {name: "Ferrari F40", conso: 12.4, type: E98}, // 12.4 l/100km
    {name: "Ford Fiesta", conso: 6.0, type: E85}, // 5.1 l/100km
]

async function main() {
    const data = await computeData();
    await createMainGraph(data);
    const select = fillSelect();
    await createCarConsoGraph(data, select);
    const dataChargingStations = await computeDataChargingStations();
    await createChargingStationsGraph(dataChargingStations);
}

async function computeData() {
    return await d3.csv("data/global_prices.csv", (data) => {
        return {
            date: d3.timeParse("%Y-%m")(data.date),
            prix95E10: parseFloat(data.prix95E10),
            prix98: parseFloat(data.prix98E10),
            prixGazole: parseFloat(data.prixGazole),
            prixElec: parseFloat(data.prixElec)
        };
    });
}

async function computeDataChargingStations() {
    return await d3.csv("data/Tarifs_recharge_publique.csv", (data) => {
        let dtMesure = d3.timeParse("%Y-%m")(data.DT_MESURE);
        const typeRecharge = data.TYPE_RECHARGE;

        if (typeRecharge === "Rapide") {
            dtMesure.setDate(dtMesure.getDate() + 7);
        } else if (typeRecharge === "Ultra-Rapide") {
            dtMesure.setDate(dtMesure.getDate() + 14);
        }

        return {
            DT_MESURE: dtMesure,
            PTTC_HFA: parseFloat(data.PTTC_HFA),
            TYPE_RECHARGE: typeRecharge
        };
    });
}

function fillSelect() {
    let select = document.getElementById("carSelector");
    carStats.forEach((car) => {
        const option = document.createElement("option");
        option.value = car.name;
        option.text = car.name;
        select.appendChild(option);
    });
    return select;
}
function createDataForCar(initData, select) {

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
                return "prixGazole";
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
    // Declare the chart dimensions and margins.
    const width = 900;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 60;

    // Declare the x (horizontal position) scale.

    const x = d3.scaleUtc()
        .domain([data[data.length - 1].date, data[0].date])
        .range([marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([0, data.reduce((max, d) => Math.max(max, d.prix95E10, d.prix98, d.prixGazole, d.prixElec), 0)])
        .range([height - marginBottom, marginTop]);

    // Declare the line generator.

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height);

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    // Add the y-axis.
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


    // Add the line
    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "magenta")
        .attr("stroke-width", 1.5)
        .attr("d", line_95(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("d", line_98(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", line_gazole(data));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line_elec(data));
    // delete all previous svg
  //  d3.select("svg").remove();
    // Append the SVG element.
    containerMainGraph.append(svg.node());

}


async function createCarConsoGraph(initData, select) {
    const data = createDataForCar(initData, select);
    data.sort((a, b) => b.priceFor100Km - a.priceFor100Km);
// set the dimensions and margins of the graph
    const margin = {top: 20, right: 30, bottom: 40, left: 150},
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

// append the svg object to the body of the page
    const svg = d3.select("#containerCarGraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    // Add X axis 
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.priceFor100Km; })])
        .range([ 0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");
    const format = x.tickFormat(20, ".2f");
    // Y axis
    const y = d3.scaleBand()
        .range([ 0, height ])
        .domain(data.map(d => d.name))
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))
    //Bars add color and value on bars
    svg.selectAll("myRect")
        .data(data)
        .join("rect")
        .attr("x", x(0) )
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
        .text((d) => format(d.priceFor100Km)+" €");

}

async function createChargingStationsGraph(dataChargingStations) {

    // set the dimensions and margins of the graph
    const margin = { top: 50, right: 30, bottom: 40, left: 150 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    // append the svg object to the body of the page
    const svg = d3.select("#containerChargingStationsGraph")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 200)
        .attr("height", height + margin.top + margin.bottom + 50)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Add X axis for dates
    const x = d3.scaleUtc()
        .domain(d3.extent(dataChargingStations, function (d) { return d.DT_MESURE; }))
        .range([0, width]);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat("%b '%y")))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "start");
        
    // Y axis for prices
    const y = d3.scaleLinear()
        .domain([0, d3.max(dataChargingStations, function (d) { return d.PTTC_HFA; })])
        .range([height, 0])
    svg.append("g")
        .call(d3.axisLeft(y))

    // Bars add color and value on bars
    svg.selectAll("myRect")
        .data(dataChargingStations)
        .join("rect")
        .attr("x", (d) => x(d.DT_MESURE))
        .attr("y", (d) => y(d.PTTC_HFA))
        .attr("width", 32)
        .attr("height", (d) => height - y(d.PTTC_HFA))
        .attr("fill", (d) => d.TYPE_RECHARGE === "Rapide" ? "#82CEEB" : (d.TYPE_RECHARGE === "Ultra-Rapide" ? "#8489EB" : "#84EBC4"));

    // Add text inside bars
    svg.append("g")
        .attr("fill", "white")
        .attr("text-anchor", "middle")
        .selectAll()
        .data(dataChargingStations)
        .join("text")
        .attr("x", (d) => x(d.DT_MESURE) +15)
        .attr("y", (d) => y(d.PTTC_HFA) +50)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text((d) => d.PTTC_HFA + " € / kWh");

        // rotate each text based on ist actual location
        svg.selectAll("text").attr("transform", function(d) {
            return "rotate(-90 " + this.getAttribute("x") + "," + this.getAttribute("y") + ")";
        });

    // Add a legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(700, 100)");
    legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#8489EB");
    legend.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text("Ultra-Rapide");
    legend.append("rect")
        .attr("y", 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#82CEEB");
    legend.append("text")
        .attr("x", 30)
        .attr("y", 45)
        .text("Rapide");
    legend.append("rect")
        .attr("y", 60)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#84EBC4");
    legend.append("text")
        .attr("x", 30)
        .attr("y", 75)
        .text("Normale");

    // add title
    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 - (margin.top / 2) - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .text("Prix moyen de l'électricité des stations de recharge publiques");
        
}

main().catch(console.error);