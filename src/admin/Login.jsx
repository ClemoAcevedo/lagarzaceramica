import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { headerLogo } from '../assets/media.js';
import usePageMeta from '../hooks/usePageMeta.js';

export default function Login() {
  const { configured, isAdmin, loading, session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const destination = location.state?.from?.pathname || '/admin/piezas';

  usePageMeta('Administración — La Garza', 'Acceso al panel de administración de La Garza.');

  if (!loading && session && isAdmin) return <Navigate to={destination} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (signInError) {
      setError(signInError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="contenido" className="admin-login">
      <section className="admin-login__card">
        <img src={headerLogo} alt="La Garza" />
        <p className="admin-kicker">Administración</p>
        <h1>Bienvenida al taller.</h1>
        <p>Ingresa con la cuenta autorizada para gestionar las piezas.</p>

        {!configured ? (
          <div className="admin-message admin-message--warning" role="alert">
            <strong>Falta conectar Supabase.</strong>
            <span>Agrega la URL y la clave publicable en el archivo <code>.env.local</code>.</span>
          </div>
        ) : (
          <form className="admin-form" onSubmit={submit}>
            <label>
              Correo electrónico
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
            </label>
            <label>
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            {error && <p className="admin-field-error" role="alert">{error}</p>}
            <button className="admin-primary" type="submit" disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

