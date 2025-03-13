let session = pl.create(1000);
let prologCode = "";

// Guardar prologCode en Local Storage antes de ir al menú
document.getElementById('menuBtn').addEventListener('click', function () {
  if (prologCode) {
      localStorage.setItem("prologDatabase", prologCode);
      console.log("Guardado:", prologCode);
      alert(localStorage.getItem("prologDatabase"))
  }
  window.location.href = "../index.html"; // Redirigir después de guardar
});


document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    prologCode = e.target.result;
    // Ejecutar las consultas para llenar todas las tablas
    getQueryResults("facultad(X).", function (faculties) {
      fillUpTable(faculties, document.getElementById("facultiesTable"), 'facultad');
      loadFacultySelect(faculties);
    });

    //horarios 
    getQueryResults("horario(Materia, Dias, HoraInicio, HoraFin, Carreras, NoSemestre).", function (horarios) {
      fillUpTable(horarios, document.getElementById("scheduleTable"), 'horario');
      console.log(">>horarios ",horarios)
    });

    // Para carreras usamos el query con dos argumentos y devolvemos solo el primero
    getQueryResults("carrera(X, _).", function (careers) {
      fillUpTable(careers, document.getElementById("careersTable"), 'carrera');
      loadCareerSelectForRequirements("aptitudeCareerSelect", careers);
      loadCareerSelectForRequirements("preferenceCareerSelect", careers);
      loadCareerSelectForRequirements("abilityCareerSelect", careers);
      loadCareerSelectForRequirements("interestCareerSelect", careers);
    });

    getQueryResults("aptitud(X).", function (aptitudes) {
      fillUpTable(aptitudes, document.getElementById("skillsTable"), 'aptitud');
    });

    getQueryResults("preferencia(X).", function (preferences) {
      fillUpTable(preferences, document.getElementById("preferencesTable"), 'preferencia');
    });

    getQueryResults("habilidad(X).", function (abilities) {
      fillUpTable(abilities, document.getElementById("abilitiesTable"), 'habilidad');
    });

    getQueryResults("interes(X).", function (interests) {
      fillUpTable(interests, document.getElementById("interestsTable"), 'interes');
    });
  };

  reader.readAsText(file);
});


function getQueryResults(query, callback) {
  let elements = [];
  let newSession = pl.create(1000); // Crear una nueva sesión

  newSession.consult(prologCode, {
    success: function () {
      console.log("Base de conocimientos cargada exitosamente.");
      newSession.query(query, {
        success: function () {
          newSession.answers(x => {
            if (x === false) {
              console.log("No hay más soluciones.");
              callback(elements);
              return;
            }
            let result = pl.format_answer(x).replace('X = ', "");
            console.log("Resultado de la consulta:", result);
            elements.push(result);
          }, () => {
            callback(elements);
          });
        },
        fail: function () {
          console.log("No se encontraron resultados.");
          callback([]);
        },
        error: function (err) {
          console.log("Error en la consulta:", err);
          callback([]);
        }
      });
    },
    error: function (err) {
      console.log("Error al cargar la base de conocimientos:", err);
      callback([]);
    }
  });
}

function fillUpTable(elements, table, type) {
  let tableBody = table.getElementsByTagName("tbody")[0];
  tableBody.innerHTML = ""; // Limpiar la tabla antes de agregar filas

  if (type === "horario") {
    elements.forEach((element) => {
      let row = tableBody.insertRow();

      // Extraer los datos del string en formato Prolog
      let match = element.match(
        /Materia\s*=\s*([^,]+),\s*Dias\s*=\s*dias\(\[([^\]]+)\]\),\s*HoraInicio\s*=\s*(\d+),\s*HoraFin\s*=\s*(\d+),\s*Carreras\s*=\s*carreras\(\[([^\]]+)\]\),\s*NoSemestre\s*=\s*(\d+)/
      );
      
      if (match) {
        let curso = match[1]; // Extraemos el nombre del curso (por ejemplo, matebasica1)
        let dias = match[2].replace(/,/g, ", "); // Formatear días (lunes, jueves)
        let horaInicio = match[3] + ":00"; // Formatear la hora de inicio (7 -> 7:00)
        let horaFin = match[4] + ":00"; // Formatear la hora de fin (10 -> 10:00)
        let carreras = match[5].replace(/,/g, ", "); // Formatear carreras (ingenieriaCivil, sistemas)
        let semestre = match[6]; // Extraemos el semestre (1)
      
        let data = [curso, dias, horaInicio, horaFin, carreras, semestre];
        console.log(data); // Muestra los datos formateados
        

        // Insertar las celdas en la fila
        data.forEach((text) => {
          let cell = row.insertCell();
          cell.appendChild(document.createTextNode(text));
        });

        // Agregar las acciones (editar y borrar)
        let actionsCell = row.insertCell();
        actionsCell.classList.add("actions");

        let editIcon = document.createElement("i");
        editIcon.classList.add("fa", "fa-edit");

        let trashIcon = document.createElement("i");
        trashIcon.classList.add("fa", "fa-trash");
        trashIcon.id = element;
        trashIcon.addEventListener("click", function () {
          console.log("Se ha hecho clic en borrar. ID:", this.id, "Tipo:", type);

          let prologLines = prologCode.split("\n");
          let lineToRemove = element + ".";
          prologLines = prologLines.filter((line) => line.trim() !== lineToRemove);

          prologCode = prologLines.join("\n");
          console.log("Código Prolog actualizado después de eliminar:", prologCode);

          session = pl.create(1000);
          session.consult(prologCode, {
            success: function () {
              getQueryResults("horario(Materia, Dias, HoraInicio, HoraFin, Carreras, NoSemestre).", function (horarios) {
                fillUpTable(horarios, document.getElementById("scheduleTable"), "horario");
                console.log(horarios);
              });
              console.log("Recargando horarios...");
            },
            error: function (err) {
              console.log("Error al recargar la base de conocimientos: " + err);
            }
          });
        });

        actionsCell.appendChild(editIcon);
        actionsCell.appendChild(trashIcon);
      }
    });
  } else {
    elements.forEach((element) => {
      let row = tableBody.insertRow();

      // Primera celda: muestra el dato obtenido
      let textCell = row.insertCell();
      textCell.appendChild(document.createTextNode(element));

      // Segunda celda: íconos de acción (editar y borrar)
      let actionsCell = row.insertCell();
      actionsCell.classList.add("actions");

      let editIcon = document.createElement("i");
      editIcon.classList.add("fa", "fa-edit");

      let trashIcon = document.createElement("i");
      trashIcon.classList.add("fa", "fa-trash");
      trashIcon.id = element;
      trashIcon.addEventListener("click", function () {
        console.log("Se ha hecho clic en borrar. ID:", this.id, "Tipo:", type);

        let prologLines = prologCode.split("\n");

        

        if (type === "carrera") {
          let regex = new RegExp(`^\\s*carrera\\(${this.id}\\s*,`);
          prologLines = prologLines.filter((line) => !regex.test(line.trim()));
        } else {
          let lineToRemove = `${type}(${this.id}).`;
          prologLines = prologLines.filter((line) => line.trim() !== lineToRemove);
        }

        prologCode = prologLines.join("\n");
        console.log("Código Prolog actualizado después de eliminar:", prologCode);

        session = pl.create(1000);
        session.consult(prologCode, {
          success: function () {
            if (type === "facultad") {
              getQueryResults("facultad(X).", function (faculties) {
                fillUpTable(faculties, document.getElementById("facultiesTable"), "facultad");
              });
            } else if (type === "carrera") {
              getQueryResults("carrera(X, _).", function (careers) {
                fillUpTable(careers, document.getElementById("careersTable"), "carrera");
              });
            } else if (type === "aptitud") {
              getQueryResults("aptitud(X).", function (aptitudes) {
                fillUpTable(aptitudes, document.getElementById("skillsTable"), "aptitud");
              });
            } else if (type === "preferencia") {
              getQueryResults("preferencia(X).", function (preferences) {
                fillUpTable(preferences, document.getElementById("preferencesTable"), "preferencia");
              });
            } else if (type === "habilidad") {
              getQueryResults("habilidad(X).", function (abilities) {
                fillUpTable(abilities, document.getElementById("abilitiesTable"), "habilidad");
              });
            } else if (type === "interes") {
              getQueryResults("interes(X).", function (interests) {
                fillUpTable(interests, document.getElementById("interestsTable"), "interes");
              });
            }
          },
          error: function (err) {
            console.log("Error al recargar la base de conocimientos: " + err);
          }
        });
      });

      actionsCell.appendChild(editIcon);
      actionsCell.appendChild(trashIcon);
    });
  }
}


function loadFacultySelect(faculties) {
  console.log("Facultades:", faculties);

  // Actualizar el primer select
  const select1 = document.getElementById("careerFacultySelect");
  if (select1) {
      select1.innerHTML = "";
      faculties.forEach(faculty => {
          let option = document.createElement("option");
          option.value = faculty;
          option.textContent = faculty;
          select1.appendChild(option);
      });
  }

  // Actualizar el segundo select
  const select2 = document.getElementById("careerFacultySelect2");
  if (select2) {
      select2.innerHTML = "";
      faculties.forEach(faculty => {
          let option = document.createElement("option");
          option.value = faculty;
          option.textContent = faculty;
          select2.appendChild(option);
      });
  }
}


//descargar pl
document.getElementById('downloadBtn').addEventListener('click', function () {
  if (!prologCode) {
    alert("No hay datos para descargar.");
    return;
  }
  const blob = new Blob([prologCode], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ejemplo.txt'; 
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
);

//agregar facultad
document.getElementById('addFacultadBtn').addEventListener('click', function () {
  const facultyInput = document.getElementById("facultyInput");
  let newFaculty = facultyInput.value.trim();
  if (newFaculty === "") {
    alert("Por favor, ingrese el nombre de la facultad.");
    return;
  }
  // Crear el nuevo hecho en el formato esperado: facultad(valor).
  let newFact = `facultad(${newFaculty}).`;
  prologCode += "\n" + newFact + "\n";
  console.log("Nueva facultad agregada:", newFact);
  facultyInput.value = ""; 


  getQueryResults("facultad(X).", function (faculties) {
    loadFacultySelect(faculties);
    fillUpTable(faculties, document.getElementById("facultiesTable"), 'facultad');
  });
});

//agregar carrera
document.getElementById('addCareerBtn').addEventListener('click', function () {
  const careerInput = document.getElementById("careerInput");
  const careerFacultySelect = document.getElementById("careerFacultySelect");
  let newCareer = careerInput.value.trim();
  let selectedFaculty = careerFacultySelect.value;
  if (newCareer === "") {
    alert("Por favor, ingrese el nombre de la carrera.");
    return;
  }

  let newFact = `carrera(${newCareer}, ${selectedFaculty}).`;
  prologCode += "\n" + newFact;
  console.log("Nueva carrera agregada:", newFact);
  careerInput.value = ""; 


  getQueryResults("carrera(X, _).", function (careers) {
    loadCareerSelectForRequirements("aptitudeCareerSelect", careers);
    loadCareerSelectForRequirements("preferenceCareerSelect", careers);
    loadCareerSelectForRequirements("abilityCareerSelect", careers);
    loadCareerSelectForRequirements("interestCareerSelect", careers);

    fillUpTable(careers, document.getElementById("careersTable"), 'carrera');
  });
});

function loadCareerSelectForRequirements(selectId, careers) {
  const select = document.getElementById(selectId);
  select.innerHTML = ""; 
  careers.forEach(career => {
    let option = document.createElement("option");
    option.value = career;
    option.textContent = career;
    select.appendChild(option);
  });
}

//agregar horario
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById('addScheduleBtn').addEventListener('click', function () {
    const courseInput = document.getElementById("courseInput");
    const daysInput = document.getElementById("daysInput");
    const startTimeInput = document.getElementById("startTimeInput");
    const endTimeInput = document.getElementById("endTimeInput");
    const careerSelect = document.getElementById("careerFacultySelect2");
    const semesterInput = document.getElementById("semesterInput");

    console.log("Valores capturados:");
    console.log("Curso:", courseInput?.value);
    console.log("Días:", daysInput?.value);
    console.log("Hora de inicio:", startTimeInput?.value);
    console.log("Hora de fin:", endTimeInput?.value);
    console.log("Carrera:", careerSelect?.value);
    console.log("Semestre:", semesterInput?.value);

    if (!courseInput || !daysInput || !startTimeInput || !endTimeInput || !careerSelect || !semesterInput) {
      console.error("Uno o más elementos no fueron encontrados en el DOM.");
      return;
    }

    let course = courseInput.value.trim();
    let days = daysInput.value.trim().split(",").map(d => d.trim()).join(","); 
    let startTime = startTimeInput.value.trim();
    let endTime = endTimeInput.value.trim();
    let career = careerSelect.value.trim();
    let semester = parseInt(semesterInput.value.trim(), 10);

    if (!course || !days || !startTime || !endTime || !career || isNaN(semester)) {
      alert("Por favor, complete todos los campos correctamente.");
      return;
    }

    // Convertir la hora de formato "HH:MM" a solo la hora en número
    let startHour = parseInt(startTime.split(":")[0], 10);
    let endHour = parseInt(endTime.split(":")[0], 10);

    let newFact = `horario(${course}, dias([${days}]), ${startHour}, ${endHour}, carreras([${career}]), ${semester}).`;
    prologCode += "\n" + newFact;
    console.log("Nuevo horario agregado:", newFact);

    // Limpiar los campos del formulario
    courseInput.value = "";
    daysInput.value = "";
    startTimeInput.value = "";
    endTimeInput.value = "";
    careerSelect.value = "";
    semesterInput.value = "";

    getQueryResults("horario(Materia, Dias, HoraInicio, HoraFin, Carreras, NoSemestre).", function (horarios) {
      fillUpTable(horarios, document.getElementById("scheduleTable"), 'horario');
    });
  });
});



//agregar aptitud
document.getElementById('addAptitudeBtn').addEventListener('click', function () {
  const aptitudeInput = document.getElementById("aptitudeInput");
  const aptitudeCareerSelect = document.getElementById("aptitudeCareerSelect");
  let newAptitude = aptitudeInput.value.trim();
  let selectedCareer = aptitudeCareerSelect.value;
  if (newAptitude === "") {
    alert("Por favor, ingrese el nombre de la aptitud.");
    return;
  }
  let newGlobalFact = `aptitud(${newAptitude}).`;
  let newAssociationFact = `requisito(${selectedCareer},aptitud,${newAptitude}).`;
  prologCode += "\n" + newGlobalFact + "\n" + newAssociationFact;
  console.log("Nueva aptitud agregada:", newGlobalFact, newAssociationFact);
  aptitudeInput.value = "";
  // Actualizar tabla de aptitudes
  getQueryResults("aptitud(X).", function (aptitudes) {
    fillUpTable(aptitudes, document.getElementById("skillsTable"), 'aptitud');
  });
});

document.getElementById('addPreferenceBtn').addEventListener('click', function () {
  const preferenceInput = document.getElementById("preferenceInput");
  const preferenceCareerSelect = document.getElementById("preferenceCareerSelect");
  let newPreference = preferenceInput.value.trim();
  let selectedCareer = preferenceCareerSelect.value;
  if (newPreference === "") {
    alert("Por favor, ingrese el nombre de la preferencia.");
    return;
  }
  let newGlobalFact = `preferencia(${newPreference}).`;
  let newAssociationFact = `requisito(${selectedCareer},preferencia,${newPreference}).`;
  prologCode += "\n" + newGlobalFact + "\n" + newAssociationFact;
  console.log("Nueva preferencia agregada:", newGlobalFact, newAssociationFact);
  preferenceInput.value = "";
  getQueryResults("preferencia(X).", function (preferences) {
    fillUpTable(preferences, document.getElementById("preferencesTable"), 'preferencia');
  });
});

document.getElementById('addAbilityBtn').addEventListener('click', function () {
  const abilityInput = document.getElementById("abilityInput");
  const abilityCareerSelect = document.getElementById("abilityCareerSelect");
  let newAbility = abilityInput.value.trim();
  let selectedCareer = abilityCareerSelect.value;
  if (newAbility === "") {
    alert("Por favor, ingrese el nombre de la habilidad.");
    return;
  }
  let newGlobalFact = `habilidad(${newAbility}).`;
  let newAssociationFact = `requisito(${selectedCareer},habilidad,${newAbility}).`;
  prologCode += "\n" + newGlobalFact + "\n" + newAssociationFact;
  console.log("Nueva habilidad agregada:", newGlobalFact, newAssociationFact);
  abilityInput.value = "";
  getQueryResults("habilidad(X).", function (abilities) {
    fillUpTable(abilities, document.getElementById("abilitiesTable"), 'habilidad');
  });
});

document.getElementById('addInterestBtn').addEventListener('click', function () {
  const interestInput = document.getElementById("interestInput");
  const interestCareerSelect = document.getElementById("interestCareerSelect");
  let newInterest = interestInput.value.trim();
  let selectedCareer = interestCareerSelect.value;
  if (newInterest === "") {
    alert("Por favor, ingrese el nombre del interés.");
    return;
  }
  let newGlobalFact = `interes(${newInterest}).`;
  let newAssociationFact = `requisito(${selectedCareer},interes,${newInterest}).`;
  prologCode += "\n" + newGlobalFact + "\n" + newAssociationFact;
  console.log("Nuevo interés agregado:", newGlobalFact, newAssociationFact);
  interestInput.value = "";
  getQueryResults("interes(X).", function (interests) {
    fillUpTable(interests, document.getElementById("interestsTable"), 'interes');
  });
});

