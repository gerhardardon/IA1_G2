document.addEventListener("DOMContentLoaded", function () {
    let prologCode = localStorage.getItem("prologDatabase");
    if (!prologCode) {
        console.log(prologCode);
        console.log(localStorage.getItem("prologDatabase"));
        alert("No se encontró la base de conocimientos en el Local Storage.");
        return;
    }

    let session = pl.create(1000);
    session.consult(prologCode, {
        success: function () {
            loadSelectableOptions();
        },
        error: function (err) {
            console.log("Error al cargar la base de conocimientos:", err);
        }
    });

    function loadSelectableOptions() {
        let categories = {
            aptitud: "aptitudesContainer",
            preferencia: "preferenciasContainer",
            habilidad: "habilidadesContainer",
            interes: "interesesContainer"
        };

        Object.entries(categories).forEach(([type, containerId]) => {
            getQueryResults(`${type}(X).`, function (results) {
                let container = document.getElementById(containerId);
                results.forEach(option => {
                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.value = option;
                    checkbox.id = `${type}-${option}`;

                    let label = document.createElement("label");
                    label.setAttribute("for", `${type}-${option}`);
                    label.textContent = option;

                    let div = document.createElement("div");
                    div.appendChild(checkbox);
                    div.appendChild(label);
                    container.appendChild(div);
                });
            });
        });
    }

    function getQueryResults(query, callback) {
        let elements = [];
        let newSession = pl.create(1000);

        newSession.consult(prologCode, {
            success: function () {
                newSession.query(query, {
                    success: function () {
                        newSession.answers(x => {
                            if (x === false) {
                                callback(elements);
                                return;
                            }
                            let result = pl.format_answer(x).replace('X = ', "").trim();
                            elements.push(result);
                        }, () => callback(elements));
                    },
                    fail: function () { callback([]); },
                    error: function () { callback([]); }
                });
            },
            error: function () { callback([]); }
        });
    }

    document.getElementById("generateResults").addEventListener("click", function () {
        let aptitudes = getSelectedValues("aptitudesContainer");
        let preferencias = getSelectedValues("preferenciasContainer");
        let habilidades = getSelectedValues("habilidadesContainer");
        let intereses = getSelectedValues("interesesContainer");
    
        console.log("Aptitudes seleccionadas:", aptitudes);
        console.log("Preferencias seleccionadas:", preferencias);
        console.log("Habilidades seleccionadas:", habilidades);
        console.log("Intereses seleccionados:", intereses);
    
        let queryCarreras = `puntaje_todas(${formatPrologList(aptitudes)}, ${formatPrologList(preferencias)}, ${formatPrologList(habilidades)}, ${formatPrologList(intereses)}, Resultados).`;
        let queryFacultades = `puntaje_todas_facultades(${formatPrologList(aptitudes)}, ${formatPrologList(preferencias)}, ${formatPrologList(habilidades)}, ${formatPrologList(intereses)}, Resultados).`;
    
        console.log("Consulta Prolog (Carreras):", queryCarreras);
        console.log("Consulta Prolog (Facultades):", queryFacultades);
    
        executePrologQuery(queryCarreras, "careersTableBody", "careersChart");
        executePrologQuery(queryFacultades, "facultiesTableBody", "facultiesChart");
    });

    function formatPrologList(array) {
        if (array.length === 0) return "[]"; 
        return "[" + array.join(",") + "]";  
    }
    
    
    function getSelectedValues(containerId) {
        return Array.from(document.getElementById(containerId).querySelectorAll("input:checked"))
                    .map(input => input.value);
    }

    function executePrologQuery(query, tableBodyId, chartId) {
        let newSession = pl.create(1000);
        newSession.consult(prologCode, {
            success: function () {
                newSession.query(query, {
                    success: function () {
                        newSession.answers(x => {
                            if (x === false) return;
                            let result = pl.format_answer(x).replace('Resultados = ', "").trim();
                            updateTableAndChart(result, tableBodyId, chartId);
                        });
                    },
                    fail: function () { console.log("No se encontraron resultados."); },
                    error: function (err) { console.log("Error en la consulta:", err); }
                });
            },
            error: function (err) { console.log("Error al cargar Prolog:", err); }
        });
    }

    function updateTableAndChart(result, tableBodyId, chartId) {
        console.log("Resultado crudo de Prolog:", result);
    
        let formattedResult = result
            .replace(/(\w+)/g, '"$1"') // Agregar comillas a nombres
            .replace(/"\d+"/g, match => match.replace(/"/g, '')); // Quitar comillas en números
    
        try {
            let data = JSON.parse(formattedResult);
            if (data.length === 0) return; // Si no hay datos, salir
    
            // Obtener la suma total de los puntajes para normalizar al 100%
            let totalScore = data.reduce((sum, item) => sum + item[1], 0);
            if (totalScore === 0) return; // Evita división por 0
    
            let tableBody = document.getElementById(tableBodyId);
            tableBody.innerHTML = "";
            let labels = [], scores = [];
    
            data.forEach(([name, score]) => {
                let percentage = ((score / totalScore) * 100).toFixed(2); 
    
                // Agregar a la tabla
                let row = tableBody.insertRow();
                row.insertCell().textContent = name;
                row.insertCell().textContent = percentage + "%";
    
                // Datos para la gráfica
                labels.push(name);
                scores.push(parseFloat(percentage));
            });
    
            updateChart(chartId, labels, scores);
        } catch (error) {
            console.error("Error al convertir resultado a JSON:", error, "Resultado:", formattedResult);
        }
    }
    

    function updateChart(chartId, labels, scores) {
        let ctx = document.getElementById(chartId).getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{ label: "Puntaje", data: scores, backgroundColor: "rgba(75, 192, 192, 0.6)" }]
            },
            options: { responsive: true }
        });
    }
});
