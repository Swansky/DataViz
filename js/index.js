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
    const data = await computeData(); // On charge les données de prix
    await createMainGraph(data); // On crée le graphique principal
    await createCarConsoGraph(data); // On crée le graphique de consommation des voitures
    const dataChargingStations = await computeDataChargingStations(); // On charge les données de prix des stations de recharge 
    await createChargingStationsGraph(dataChargingStations); // On crée le graphique des stations de recharge
}

async function computeData() { // On charge les données de prix a partir d'un .csv avec D3
    return await d3.csv("data/global_prices.csv", (data) => {
        return { // On retourne un objet avec les données formatées
            date: d3.timeParse("%Y-%m")(data.date),
            prix95E10: parseFloat(data.prix95E10),
            prix98: parseFloat(data.prix98E10),
            prixGazole: parseFloat(data.prixGazole),
            prixElec: parseFloat(data.prixElec),
            prixE85: parseFloat(data.prixE85)
        };
    });
}

async function computeDataChargingStations() { // On charge les données de prix des stations de recharge a partir d'un .csv avec D3
    return await d3.csv("data/Tarifs_recharge_publique.csv", (data) => { 
        let dtMesure = d3.timeParse("%Y-%m")(data.DT_MESURE);
        const typeRecharge = data.TYPE_RECHARGE;

        if (typeRecharge === "Rapide") { // On ajoute 7 jours si c'est une recharge rapide pour décaler les barres
            dtMesure.setDate(dtMesure.getDate() + 7);
        } else if (typeRecharge === "Ultra-Rapide") { // On ajoute 14 jours si c'est une recharge ultra-rapide pour décaler les barres
            dtMesure.setDate(dtMesure.getDate() + 14);
        }

        return { // On retourne un objet avec les données formatées
            DT_MESURE: dtMesure,
            PTTC_HFA: parseFloat(data.PTTC_HFA),
            TYPE_RECHARGE: typeRecharge
        };
    });
}
function createDataForCar(initData) { // On crée les données pour le graphique de consommation des voitures
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

    return carStats.map((d) => { // On crée un objet avec le nom de la voiture et le carburant correspondant
        return {
            name: d.name + " (" + d.type + ")",
            priceFor100Km: d.conso * lastPrices[convertTypeForCsvColumn(d.type)],
        }
    });
}

async function createMainGraph(data) { // On crée le graphique principal
    const containerMainGraph = d3.select("#containerMainGraph");

    const width = 900;
    const height = 350;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 30;

    const x = d3.scaleUtc() // On crée l'axe X
        .domain([data[data.length - 1].date, data[0].date])
        .range([marginLeft, width - marginRight]);


    const y = d3.scaleLinear() // On crée l'axe Y
        .domain([0, data.reduce((max, d) => Math.max(max, d.prix95E10, d.prix98, d.prixGazole, d.prixElec), 0)])
        .range([height - marginBottom, marginTop]);

    
    const svg = d3.create("svg")
        .attr("width", width +120)
        .attr("height", height) ;

    svg.append("g") // On dessine l'axe X
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x))
        .selectAll("path,line") // Sélectionne les éléments path et line de l'axe X
        .style("stroke", "black"); // Change la couleur en noir

    svg.selectAll(".tick text") // Sélectionne les éléments de texte dans les ticks de l'axe X
        .style("fill", "black");

    svg.append("g") // On dessine l'axe Y
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y))
        .selectAll("path,line") // Sélectionne les éléments path et line de l'axe X
        .style("stroke", "black"); // Change la couleur en noir

    svg.selectAll(".tick text") // Sélectionne les éléments de texte dans les ticks de l'axe X
        .style("fill", "black");
    
    // On crée les lignes
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

    // On crée le texte de la légende
    let legendData = [
        {label: "95E10", color: "#5DABEB"},
        {label: "98E10", color: "#82CEEB"},
        {label: "Diesel", color: "#CEA3EA"},
        {label: "Elec domicile", color: "#818AEB"},
        {label: "E85", color: "#81EBC3"}
    ];

    // On dessine les lignes
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


    // On dessine la légende
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

    d3.select(".data-viz-container").html(""); // Effacer les anciens graphiques
    d3.select(".data-viz-container").node().appendChild(svg.node()); // Ajouter le graphique au conteneur
}


async function createCarConsoGraph(initData) { // On crée le graphique de consommation des voitures
    const containerCarConsoGraph= d3.select("#containerCarConsoGraph"); // On sélectionne le conteneur
    const data = createDataForCar(initData); // On crée les données pour le graphique de consommation des voitures

    data.sort((a, b) => b.priceFor100Km - a.priceFor100Km); // On trie les données par prix décroissant

    const margin = {top: 20, right: 50, bottom: 40, left: 30}, // On définit les marges du graphe
        width = 700 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    const svg = d3.create("svg").attr("width", 1100).attr("height", 400); // On crée l'élément SVG 
        console.log("SVG Node:", svg.node());
    
    // On crée l'axe X
    const x = d3.scaleLinear() 
        .domain([0, d3.max(data, function (d) {
            return d.priceFor100Km;
        })])
        .range([0, width]);
    
    const xAxis = d3.axisBottom(x);
    // On dessine l'axe X
    svg.append("g")
       .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("path,line,Text")
        .style("stroke", "black");
    
     svg.selectAll(".tick text")
            .style("fill", "black");
    
    const format = x.tickFormat(20, ".2f");

    // On crée l'axe Y et on le dessine
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.name))
        .padding(.1);
    svg.append("g")
        .call(d3.axisLeft(y))

    // On dessine les barres
    svg.selectAll("myRect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", d => y(d.name))
        .attr("width", d => x(d.priceFor100Km))
        .attr("height", y.bandwidth())
        .attr("fill", "#82CEEB");

    // On dessine les textes dans les barres
    svg.append("g")
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .selectAll()
        .data(data)
        .join("text")
        .attr("x", (d) => x(d.priceFor100Km))
        .attr("y", (d) => y(d.name) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text((d) => format(d.priceFor100Km) + " €");

    // On crée la légende
    let legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(850, 100)");
    let lastData = initData[0];
    let legendData = [
        {label: "95E10", price: lastData.prix95E10},
        {label: "98E10", price: lastData.prix98},
        {label: "Diesel", price: lastData.prixGazole},
        {label: "Elec domicile", price: lastData.prixElec},
        {label: "E85", price: lastData.prixE85},

    ];

    // On dessine la légende
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
    d3.select(".data-viz-container").html(""); // Effacer les anciens graphiques
    d3.select(".data-viz-container").node().appendChild(svg.node()); // Ajouter le graphique au conteneur

}


async function createChargingStationsGraph(dataChargingStations) { // On crée le graphique des stations de recharge
    const containerChargingStationsGraph = d3.select("#containerChargingStationsGraph");

    const margin = { top: 50, right: 30, bottom: 40, left: 200}, // On définit les marges du graphe
        width = 1000 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;


    // Créer l'élément SVG et stocker dans une variable
    const svg = d3.create("svg")
        .attr("width", width + margin.left + margin.right + 200)
        .attr("height", height + margin.top + margin.bottom);


    const x = d3.scaleUtc() // On crée l'axe X
        .domain([
            d3.min(dataChargingStations, function (d) { return d.DT_MESURE; }),
            d3.timeDay.offset(d3.max(dataChargingStations, function (d) { return d.DT_MESURE; }), 14)
        ])
        .range([0, width]);
    
        const yAxisOffset = 50;
    svg.append("g") // On dessine l'axe X
        .attr("transform", `translate(0, ${height + yAxisOffset})`)
        .call(d3.axisBottom(x)
            .ticks(d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat("%b '%y")))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "start");


    const y = d3.scaleLinear() // On crée l'axe Y
        .domain([0, d3.max(dataChargingStations, function (d) { return d.PTTC_HFA; })])
        .range([height, 0])
    svg.append("g") // On dessine l'axe Y
        .call(d3.axisLeft(y))


    svg.selectAll("myRect") // On dessine les barres
        .data(dataChargingStations)
        .join("rect")
        .attr("x", (d) => x(d.DT_MESURE))
        .attr("y", (d) => y(d.PTTC_HFA))
        .attr("width", 32)
        .attr("height", (d) => height - y(d.PTTC_HFA))
        .attr("fill", (d) => d.TYPE_RECHARGE === "Rapide" ? "#82CEEB" : (d.TYPE_RECHARGE === "Ultra-Rapide" ? "#8489EB" : "#84EBC4"));


// Définit la couleur des lignes des axes en noir
    svg.selectAll(".tick text")
        .style("fill", "black"); // Définit la couleur du texte en noir

    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("path, line")
        .style("stroke", "black"); // Définit la couleur des lignes et chemins en noir

    svg.selectAll(".tick text")
        .style("fill", "black"); // Définit la couleur du texte en noir

    // On dessine les textes dans les barres
    svg.append("g")
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .selectAll()
        .data(dataChargingStations)
        .join("text")
        .attr("x", (d) => x(d.DT_MESURE) +15)
        .attr("y", (d) => y(d.PTTC_HFA) +50)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text((d) => d.PTTC_HFA + " € / kWh");


    // On transforme le texte pour l'afficher à la verticale
    svg.selectAll("text").attr("transform", function(d) {
        let x = this.getAttribute("x") || 0; // Utiliser 0 si x est null
        let y = this.getAttribute("y") || 0; // Utiliser 0 si y est null
        return "rotate(-90 " + x + "," + y + ")";
    });
        
    // On crée la légende et on la dessine
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(850, 100)");
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
        
        d3.select(".data-viz-container").html(""); // Effacer les anciens graphiques
        d3.select(".data-viz-container").node().appendChild(svg.node()); // Ajouter le graphique au conteneur
        console.log("SVG ajouté au conteneur");

}

async function main() { // Fonction principale
    const data = await computeData(); // On charge les données de prix
    const dataChargingStations = await computeDataChargingStations(); // On charge les données de prix des stations de recharge

    // Fonction pour dormir (delay)
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Code pour la fonction JS "Carrousel"
    while (true) { // Boucle infinie pour répéter l'effet
        document.querySelector('.title-container h1').textContent = 'Évolution du prix de l\'essence en moyenne en France'; // Titre pour le graphique principal
        await createMainGraph(data);
        await sleep(5000); // Attendre 5 secondes

        document.querySelector('.title-container h1').textContent = 'Prix pour 100 km mixte pour des modèles de voitures variés'; // Titre pour le graphique de consommation des voitures
        await createCarConsoGraph(data);
        await sleep(5000); // Attendre 5 secondes

        document.querySelector('.title-container h1').textContent = 'Prix moyen de l\'électricité des stations de recharge publiques'; // Titre pour le graphique des stations de recharge
        await createChargingStationsGraph(dataChargingStations);
        await sleep(5000); // Attendre 5 secondes
    }
}

main().catch(console.error); // Lancer la fonction principale
