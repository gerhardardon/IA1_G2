% Facultades =====================
facultad(ingenieria).
facultad(ciencias).
facultad(bellas_arts).

% Carreras =====================
carrera(ingenieriaCivil, ingenieria).
carrera(sistemas, ingenieria).
carrera(electronica, ingenieria).
carrera(matematicas, ciencias).
carrera(disenoGrafico, bellas_arts).

% Aptitudes ======================
aptitud(creatividad).
aptitud(analitica).
aptitud(practica).

% Preferencias ======================
preferencia(tecnica).
preferencia(artistica).
preferencia(investigacion).

% Habilidades ======================
habilidad(programacion).
habilidad(calculo).
habilidad(dibujo).

% Intereses ======================
interes(tecnologia).
interes(arte).
interes(ciencias).

% Requisitos de cada carrera ======================
requisito(ingenieriaCivil, aptitud, analitica).
requisito(ingenieriaCivil, aptitud, practica).
requisito(ingenieriaCivil, preferencia, tecnica).
requisito(ingenieriaCivil, habilidad, calculo).
requisito(ingenieriaCivil, interes, tecnologia).

requisito(sistemas, aptitud, analitica).
requisito(sistemas, preferencia, tecnica).
requisito(sistemas, habilidad, programacion).
requisito(sistemas, interes, tecnologia).

requisito(electronica, aptitud, analitica).
requisito(electronica, aptitud, practica).
requisito(electronica, preferencia, tecnica).
requisito(electronica, habilidad, calculo).
requisito(electronica, interes, tecnologia).

requisito(matematicas, aptitud, analitica).
requisito(matematicas, preferencia, investigacion).
requisito(matematicas, habilidad, calculo).
requisito(matematicas, interes, ciencias).

requisito(disenoGrafico, aptitud, creatividad).
requisito(disenoGrafico, preferencia, artistica).
requisito(disenoGrafico, habilidad, dibujo).
requisito(disenoGrafico, interes, arte).

% horarios de las materias

% horario(Materia, Dias, HoraInicio, HoraFin, Carreras, No.Semestre)

horario(matebasica1, dias([lunes, jueves]), 7, 10, carreras([ingenieriaCivil, sistemas]), 1).
horario(matebasica2, dias([martes, jueves]), 10, 12, carreras([ingenieriaCivil, sistemas]), 1).


horario(fisica1, dias([miercoles]), 11, 13, carreras([ingenieriaCivil, sistemas]), 3).
horario(fisica2, dias([viernes]), 17, 19, carreras([ingenieriaCivil, sistemas]), 4).





member(X, [X|_]).
member(X, [_|T]) :- member(X, T).

% Definición de length para Tau Prolog
length([], 0).
length([_|T], N) :- length(T, N1), N is N1 + 1.

% Definición de sum_list para Tau Prolog
sum_list([], 0).
sum_list([H|T], Sum) :-
    sum_list(T, SumT),
    Sum is H + SumT.

% Regla para calcular el puntaje de una carrera
calcular_puntaje(Carrera, AptitudesUsuario, PreferenciasUsuario, HabilidadesUsuario, InteresesUsuario, Puntaje) :-
    findall(1, (requisito(Carrera, aptitud, ReqAptitud), member(ReqAptitud, AptitudesUsuario)), ListaAptitudes),
    length(ListaAptitudes, PuntajeAptitudes),

    findall(1, (requisito(Carrera, preferencia, ReqPreferencia), member(ReqPreferencia, PreferenciasUsuario)), ListaPreferencias),
    length(ListaPreferencias, PuntajePreferencias),

    findall(1, (requisito(Carrera, habilidad, ReqHabilidad), member(ReqHabilidad, HabilidadesUsuario)), ListaHabilidades),
    length(ListaHabilidades, PuntajeHabilidades),

    findall(1, (requisito(Carrera, interes, ReqInteres), member(ReqInteres, InteresesUsuario)), ListaIntereses),
    length(ListaIntereses, PuntajeIntereses),

    Puntaje is PuntajeAptitudes + PuntajePreferencias + PuntajeHabilidades + PuntajeIntereses.

% Regla para obtener puntaje de todas las carreras
puntaje_todas(Aptitudes, Preferencias, Habilidades, Intereses, Resultados) :-
    findall(
        [Carrera, Puntaje],  
        (   
            carrera(Carrera, _),  
            calcular_puntaje(Carrera, Aptitudes, Preferencias, Habilidades, Intereses, Puntaje)  
        ),
        Resultados  
    ).

% Regla para obtener puntajes de todas las facultades
puntaje_todas_facultades(Aptitudes, Preferencias, Habilidades, Intereses, Resultados) :-
    findall(
        [Facultad, PuntajeTotal], 
        (
            facultad(Facultad),
            findall(Puntaje, 
                (
                    carrera(Carrera, Facultad), 
                    calcular_puntaje(Carrera, Aptitudes, Preferencias, Habilidades, Intereses, Puntaje)
                ), 
                Puntajes),
            sum_list(Puntajes, PuntajeTotal)
        ), 
        Resultados
    ).
