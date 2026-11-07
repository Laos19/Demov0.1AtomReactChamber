import { useId, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../estado/AppContext';
import { Aviso } from '../componentes/ui';

/** Inicio de sesión y registro, con accesos rápidos a las cuentas de demostración. */
export default function Ingresar() {
  const { fuente, setUsuario } = useApp();
  const nav = useNavigate();
  const [qs] = useSearchParams();
  const volver = qs.get('volver') ?? '/mapa';
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [f, setF] = useState({ nombre: '', email: '', password: '', rol: 'estudiante' as 'estudiante' | 'docente', grado: 3, codigoDocente: '' });
  const ids = { nombre: useId(), email: useId(), pass: useId(), grado: useId(), cod: useId() };

  const entrar = async (email: string, password: string) => {
    setError(null);
    setEnviando(true);
    try {
      const r = await fuente.login(email, password);
      setUsuario(r.usuario);
      nav(r.usuario.rol === 'estudiante' ? volver : '/aula');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (modo === 'login') return entrar(f.email, f.password);
    setError(null);
    setEnviando(true);
    try {
      const r = await fuente.registro({ nombre: f.nombre, email: f.email, password: f.password, rol: f.rol, grado: f.rol === 'estudiante' ? f.grado : undefined, codigoDocente: f.codigoDocente || undefined });
      setUsuario(r.usuario);
      nav(r.usuario.rol === 'estudiante' ? volver : '/aula');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[1fr_320px]">
      <section className="panel p-6">
        <div role="tablist" aria-label="Acceso" className="flex gap-2">
          {(['login', 'registro'] as const).map((m) => (
            <button key={m} role="tab" type="button" aria-selected={modo === m} onClick={() => setModo(m)}
              className={`min-h-[44px] rounded-md px-4 font-bold ${modo === m ? 'bg-tinta text-papel' : 'hover:bg-linea/70'}`}>
              {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          ))}
        </div>
        <form onSubmit={enviar} className="mt-6 space-y-4" noValidate>
          {modo === 'registro' && (
            <>
              <div>
                <label htmlFor={ids.nombre} className="etiqueta">Nombre y apellido</label>
                <input id={ids.nombre} className="campo" autoComplete="name" required minLength={2} value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
              </div>
              <fieldset>
                <legend className="etiqueta">Soy</legend>
                <div className="mt-1 flex gap-2">
                  {(['estudiante', 'docente'] as const).map((r) => (
                    <label key={r} className={`flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-lg border-2 font-bold ${f.rol === r ? 'border-tinta bg-tinta text-papel' : 'border-linea'}`}>
                      <input type="radio" name="rol" value={r} checked={f.rol === r} onChange={() => setF({ ...f, rol: r })} className="sr-only" />
                      {r === 'estudiante' ? 'Estudiante' : 'Docente'}
                    </label>
                  ))}
                </div>
              </fieldset>
              {f.rol === 'estudiante' ? (
                <div>
                  <label htmlFor={ids.grado} className="etiqueta">Grado de secundaria</label>
                  <select id={ids.grado} className="campo" value={f.grado} onChange={(e) => setF({ ...f, grado: Number(e.target.value) })}>
                    {[1, 2, 3, 4, 5].map((g) => <option key={g} value={g}>{g}.º de secundaria</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor={ids.cod} className="etiqueta">Código de docente (te lo da la institución)</label>
                  <input id={ids.cod} className="campo" value={f.codigoDocente} onChange={(e) => setF({ ...f, codigoDocente: e.target.value })} />
                </div>
              )}
            </>
          )}
          <div>
            <label htmlFor={ids.email} className="etiqueta">Correo</label>
            <input id={ids.email} type="email" className="campo" autoComplete="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
          <div>
            <label htmlFor={ids.pass} className="etiqueta">Contraseña {modo === 'registro' && '(mínimo 8 caracteres)'}</label>
            <input id={ids.pass} type="password" className="campo" autoComplete={modo === 'login' ? 'current-password' : 'new-password'} required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </div>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <button type="submit" className="btn btn-primario w-full" disabled={enviando}>
            {enviando ? 'Un momento…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </section>

      <aside className="space-y-3">
        <h2 className="font-sans text-lg font-bold">Probar con una cuenta de demostración</h2>
        <p className="text-sm text-tinta-suave">Contraseña de todas: <span className="lectura">quimica2026</span></p>
        <button type="button" className="btn btn-secundario w-full justify-start" onClick={() => entrar('estudiante@demo.arc.pe', 'quimica2026')} disabled={enviando}>
          Entrar como estudiante
        </button>
        <button type="button" className="btn btn-secundario w-full justify-start" onClick={() => entrar('docente@demo.arc.pe', 'quimica2026')} disabled={enviando}>
          Entrar como docente
        </button>
        <p className="pt-2 text-sm text-tinta-suave">
          Los datos de estudiantes menores de edad se tratan según la Ley N.° 29733 de Protección de Datos Personales:
          solo se guarda nombre, correo y progreso de aprendizaje.
        </p>
      </aside>
    </div>
  );
}
