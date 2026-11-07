# Diagrama de clases

> Generado automáticamente por `scripts/docs/build-diagrams.mjs`. No editar a mano.

Clases de la API (Fastify) y del motor de simulación. Las flechas indican dependencias inyectadas por constructor.

| Clase | Archivo | Miembros |
|---|---|---|
| `AuthService` | `backend/src/auth/AuthService.ts` | 7 |
| `Database` | `backend/src/db/Database.ts` | 5 |
| `HttpError` | `backend/src/errors.ts` | 2 |
| `CatalogoRepository` | `backend/src/repositories/CatalogoRepository.ts` | 2 |
| `DashboardRepository` | `backend/src/repositories/DashboardRepository.ts` | 3 |
| `JuegoRepository` | `backend/src/repositories/JuegoRepository.ts` | 4 |
| `AulaService` | `backend/src/services/AulaService.ts` | 7 |
| `IntentoService` | `backend/src/services/IntentoService.ts` | 7 |
| `QuimiService` | `backend/src/services/QuimiService.ts` | 2 |
| `Simulation` | `frontend/src/engine/Simulation.ts` | 30 |
| `SeguidorDePaso` | `frontend/src/engine/conditions.ts` | 3 |

```mermaid
classDiagram
  direction LR
  class AuthService {
    +BCRYPT_COSTO
    -db : Database
    -codigoDocente : string
    +registrar(body)
    +login(body)
    +obtener(id)
    +payload(u)$
  }
  class Database {
    +pool : pg.Pool
    +query(text, params)
    +tx(fn)
    +ping()
    +close()
  }
  class HttpError {
    +status : number
    +code : 
  }
  class CatalogoRepository {
    -db : Database
    +obtener(ttlMs)
  }
  class DashboardRepository {
    -db : Database
    +resumen(refrescar)
    +registrarEventos(body, usuarioId)
  }
  class JuegoRepository {
    -db : Database
    +contenido()
    +progreso(usuarioId)
    +perfil(usuarioId)
  }
  class AulaService {
    -db : Database
    +crear(docenteId, nombre, grado, seccion)
    +listar(usuarioId, rol)
    +unirse(estudianteId, codigo)
    -verificarDocente(aulaId, usuarioId, rol)
    +detalle(aulaId, usuarioId, rol)
    +asignar(aulaId, usuarioId, rol, nivel, fechaLimite)
  }
  class IntentoService {
    -db : Database
    +iniciar(usuarioId, nivelCodigo)
    -verificarDueno(intentoId, usuarioId)
    +completarPaso(intentoId, usuarioId, orden, segundos)
    +pedirAyuda(intentoId, usuarioId, orden, nivelAyuda)
    +responder(intentoId, usuarioId, preguntaOrden, opcionOrden)
    +finalizar(intentoId, usuarioId)
  }
  class QuimiService {
    -db : Database
    +preguntar(consulta, nivel, paso)
  }
  class Simulation {
    +particulas : Particula
    +efectos : Efecto
    +log : EntradaLog
    +caja : Caja null
    +t
    +Tch : number
    +Tk : number
    +tMax : number
    +rxCount
    +rxById : Record string, number
    +fotolisis : Record string, number
    +chispas
    +q : Quimica
    -rng : Rng
    -gauss()
    +registrar(type, text)
    -crear(sp, x, y, T)
    +inyectar(sp, n, at)
    +vaciar()
    +reiniciar(T0)
    -efecto(e)
    -reaccionar(p, q, rx, E)
    -disociar(p, extraKJ, causa)
    +ajustarCaja(W, H, V, snap)
    +tablaDeFases(prm)
    +paso(prm, dtFrame)
    -vigilarUmbrales(prm, phase, plasma)
    +chispa()
    +particulaEn(x, y)
    +instantanea(prm)
  }
  class SeguidorDePaso {
    -c : Condicion
    +progreso
    +actualizar(s, p)
  }
  AuthService --> Database : usa
  class HttpError:::error
  CatalogoRepository --> Database : usa
  DashboardRepository --> Database : usa
  JuegoRepository --> Database : usa
  AulaService --> Database : usa
  IntentoService --> Database : usa
  QuimiService --> Database : usa
```
