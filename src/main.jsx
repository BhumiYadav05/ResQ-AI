import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  Navigate,
  useNavigate,
  useSearchParams
} from 'react-router-dom';

import './styles.css';


/* =========================
   SHARED COMPONENTS
========================= */

const Logo = () => (
  <div className="logo">
    <i>✦</i>
    RESQ AI
  </div>
);


const Metric = ({ label, value, hint, warn }) => (
  <article className="metric">
    <small>{label}</small>
    <b>{value}</b>
    <span className={warn ? 'warn' : ''}>{hint}</span>
  </article>
);


const Event = ({ icon, title, text, time, green }) => (
  <article className="event">
    <i className={green ? 'green' : ''}>{icon}</i>

    <div>
      <b>{title}</b>
      <p>{text}</p>
    </div>

    <time>{time}</time>
  </article>
);


function Priority({ title, info, risk, medium }) {
  return (
    <div className="priority">
      <div>
        <b>{title}</b>
        <span>{info}</span>
      </div>

      <strong className={medium ? 'medium' : ''}>
        {risk}
      </strong>
    </div>
  );
}


/* =========================
   HOME PAGE
========================= */

function Home() {
  const navigate = useNavigate();

const [user, setUser] = useState(null);

useEffect(() => {
  const savedUser = localStorage.getItem('resq_user');

  if (savedUser) {
    setUser(JSON.parse(savedUser));
  }
}, []);

const logout = () => {
  localStorage.removeItem('resq_user');
  navigate('/login');
};
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [incidentError, setIncidentError] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/incidents')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        return response.json();
      })
      .then(data => {
        if (data.status === 'success') {
          setIncidents(data.incidents);
        } else {
          throw new Error(data.message || 'Failed to load incidents');
        }
      })
      .catch(error => {
        console.error('Incident fetch error:', error);
        setIncidentError('Unable to load live incidents.');
      })
      .finally(() => {
        setLoadingIncidents(false);
      });
  }, []);

  return (
    <div className="page">

      <header>

        <Logo />

        <div className="header-right">

          <span className="health">
            <i />
            Systems operational
          </span>

          <span className="clock">
            01 AUG 2026 · 10:30 IST
          </span>

          {user ? (
  <>
    <span className="user-info">
      {user.organization || user.email}
    </span>

    <button
      className="signin"
      onClick={logout}
    >
      Sign out
    </button>
        </>
       ) : (
       <>
    <Link
      to="/login"
      className="signin"
    >
      Sign in
    </Link>

    <Link
      to="/login?mode=signup"
      className="signup"
    >
      Sign up
    </Link>
      </>
      )}

        </div>

      </header>


      <main className="dashboard">

        <section className="hero">

          <div className="eyebrow">
            Emergency intelligence system
          </div>

          <h1>
            Welcome, good {salutation}.
          </h1>

          <p>
            A unified view of live signals, affected regions,
            and response priorities—so every decision reaches
            the people who need it most.
          </p>

          <Link
            to="/analyze"
            className="hero-button"
          >
            Analyze a disaster →
          </Link>

          <a href="#brief">
            View incident brief
          </a>

        </section>


        <section className="map">

          <div>
            <b>Live risk overview</b>

            <span>
              Southern India · multi-source analysis
            </span>
          </div>

          <div className="map-grid" />

          <span className="hotspot one" />
          <span className="hotspot two" />
          <span className="hotspot three" />

          <small>
            ● 18 active data feeds
          </small>

        </section>


        <div className="section-head">

          <h2>
            Situation at a glance
          </h2>

          <a>
            Full analytics →
          </a>

        </div>


        <section className="metrics">

          <Metric
            label="ACTIVE INCIDENTS"
            value={incidents.length}
            hint={
            loadingIncidents
            ? 'Loading live data...'
            : `${incidents.length} incidents in system`
          }
         />

          <Metric
            label="PEOPLE AT RISK"
            value="24.8k"
            hint="↑ 8.4% projected"
            warn
          />

          <Metric
            label="RESPONSE UNITS"
            value="86"
            hint="72 currently deployed"
          />

          <Metric
            label="DATA CONFIDENCE"
            value="94%"
            hint="Across 18 live sources"
          />

        </section>


        <section className="feed">
         <h2>Live intelligence feed</h2>

           {loadingIncidents && (
            <p className="loading-text">Loading live incidents...</p>
           )}

          {incidentError && (
            <p className="error-text">{incidentError}</p>
            )}

          {!loadingIncidents && !incidentError && incidents.length === 0 && (
          <p className="loading-text">
          No disaster incidents have been reported yet.
          </p>
     )}

           {!loadingIncidents &&
              incidents.map((incident, index) => (
               <Event
                key={incident._id}
                icon={index === 0 ? '▲' : '◎'}
                title={`${incident.disaster_type} reported in ${incident.location}`}
                text={`Severity: ${incident.severity}/10`}
                time="LIVE"
                green={incident.severity < 6}
                 />
                 ))}
            </section>



        <section className="priorities">

          <div className="priority-title">

            <div>

              <h2>
                Response priorities
              </h2>

              <span>
                AI-ranked by urgency and access
              </span>

            </div>

            <em>
              LIVE
            </em>

          </div>


          <Priority
            title="Changanassery West"
            info="Flooding · 6,240 people exposed"
            risk="CRITICAL"
          />

          <Priority
            title="Vagamon Valley"
            info="Landslide risk · 3 routes blocked"
            risk="CRITICAL"
          />

          <Priority
            title="Alappuzha Coast"
            info="Storm surge · 4 shelters on standby"
            risk="ELEVATED"
            medium
          />

        </section>


        <footer>
          ALL INSIGHTS ARE CONTINUOUSLY SYNTHESIZED FROM WEATHER,
          SATELLITE, DRONE &amp; FIELD REPORTS.
        </footer>

      </main>

    </div>
  );
}


/* =========================
   ANALYZE DISASTER PAGE
========================= */

function AnalyzeDisaster() {

  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    disaster_type: 'Flood',
    location: '',
    description: '',
    severity: 5
  });


  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'severity'
          ? Number(value)
          : value
    }));

  };


  const analyzeDisaster = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError('');
    setAnalysis('');


    try {

      const response = await fetch(
        'http://127.0.0.1:8000/api/analyze-disaster',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify(formData)
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail || 'Unable to analyze disaster.'
        );
      }


      if (data.status === 'success') {

        setAnalysis(data.analysis);

      } else {

        throw new Error(
          data.message || 'Analysis failed.'
        );

      }

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Could not connect to the ResQ AI backend.'
      );

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="analyze-page">

      {/* HEADER */}

      <header className="analyze-header">

        <Link
          to="/"
          className="logo-link"
        >
          <Logo />
        </Link>


        <div className="header-right">

          <span className="health">
            <i />
            AI system operational
          </span>

          <Link
            to="/"
            className="back-dashboard"
          >
            ← Dashboard
          </Link>

        </div>

      </header>


      <main className="analyze-container">


        {/* PAGE INTRO */}

        <section className="analyze-intro">

          <div>

            <div className="eyebrow">
              AI emergency assessment
            </div>

            <h1>
              Analyze a disaster situation.
            </h1>

            <p>
              Provide the available incident information.
              ResQ AI will assess the situation and generate
              actionable emergency recommendations.
            </p>

          </div>


          <div className="status-card">

            <span className="status-dot" />

            <div>

              <b>
                AI Decision Support
              </b>

              <small>
                Gemini intelligence engine
              </small>

            </div>

          </div>

        </section>


        <div className="analyze-layout">


          {/* FORM */}

          <section className="analysis-form-card">

            <div className="card-heading">

              <div>

                <span className="step-number">
                  01
                </span>

                <div>

                  <h2>
                    Incident details
                  </h2>

                  <p>
                    Describe the emergency as accurately as possible.
                  </p>

                </div>

              </div>

            </div>


            <form
              onSubmit={analyzeDisaster}
              className="disaster-form"
            >


              {/* DISASTER TYPE */}

              <div className="form-field">

                <label>
                  DISASTER TYPE
                </label>

                <select
                  name="disaster_type"
                  value={formData.disaster_type}
                  onChange={handleChange}
                >

                  <option value="Flood">
                    Flood
                  </option>

                  <option value="Earthquake">
                    Earthquake
                  </option>

                  <option value="Landslide">
                    Landslide
                  </option>

                  <option value="Cyclone">
                    Cyclone
                  </option>

                  <option value="Wildfire">
                    Wildfire
                  </option>

                  <option value="Industrial Accident">
                    Industrial Accident
                  </option>

                  <option value="Building Collapse">
                    Building Collapse
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* LOCATION */}

              <div className="form-field">

                <label>
                  INCIDENT LOCATION
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Maharashtra"
                  required
                />

              </div>


              {/* DESCRIPTION */}

              <div className="form-field">

                <label>
                  SITUATION DESCRIPTION
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what is happening, affected areas, blocked roads, people requiring assistance, infrastructure damage, etc."
                  rows="7"
                  required
                />

                <span className="field-hint">
                  Include as many verified details as possible.
                </span>

              </div>


              {/* SEVERITY */}

              <div className="form-field">

                <div className="severity-heading">

                  <label>
                    SEVERITY LEVEL
                  </label>

                  <strong className={`severity-value severity-${formData.severity}`}>
                    {formData.severity}/10
                  </strong>

                </div>


                <input
                  className="severity-slider"
                  type="range"
                  name="severity"
                  min="1"
                  max="10"
                  value={formData.severity}
                  onChange={handleChange}
                />


                <div className="severity-labels">

                  <span>
                    LOW
                  </span>

                  <span>
                    MODERATE
                  </span>

                  <span>
                    CRITICAL
                  </span>

                </div>

              </div>


              {/* ERROR */}

              {error && (

                <div className="error-box">
                  <strong>
                    Analysis failed
                  </strong>

                  <span>
                    {error}
                  </span>
                </div>

              )}


              {/* BUTTON */}

              <button
                type="submit"
                className="analyze-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="spinner" />
                    AI is analyzing...
                  </>
                ) : (
                  <>
                    Analyze situation →
                  </>
                )}

              </button>


              <p className="privacy-note">
                ResQ AI analyzes the information you provide.
                Do not enter sensitive personal information.
              </p>

            </form>

          </section>


          {/* RESULT */}

          <section className="analysis-result-card">

            {!analysis && !loading && (

              <div className="empty-analysis">

                <div className="analysis-icon">
                  ✦
                </div>

                <div className="eyebrow">
                  AI assessment
                </div>

                <h2>
                  Awaiting incident data
                </h2>

                <p>
                  Submit the incident details to generate
                  an emergency assessment, risk evaluation,
                  evacuation guidance and response priorities.
                </p>


                <div className="assessment-points">

                  <span>
                    <i>✓</i>
                    Situation summary
                  </span>

                  <span>
                    <i>✓</i>
                    Risk classification
                  </span>

                  <span>
                    <i>✓</i>
                    Immediate actions
                  </span>

                  <span>
                    <i>✓</i>
                    Rescue priorities
                  </span>

                </div>

              </div>

            )}


            {loading && (

              <div className="loading-analysis">

                <div className="ai-loader">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="eyebrow">
                  ResQ AI intelligence engine
                </div>

                <h2>
                  Assessing the situation...
                </h2>

                <p>
                  Evaluating severity, immediate risks,
                  evacuation requirements and response priorities.
                </p>

              </div>

            )}


            {analysis && (

              <div className="analysis-content">

                <div className="result-header">

                  <div>

                    <div className="eyebrow">
                      AI-generated assessment
                    </div>

                    <h2>
                      Emergency assessment
                    </h2>

                  </div>

                  <span className="analysis-live">
                    COMPLETE
                  </span>

                </div>


                <div className="incident-summary">

                  <div>
                    <small>
                      INCIDENT
                    </small>

                    <b>
                      {formData.disaster_type}
                    </b>
                  </div>


                  <div>
                    <small>
                      LOCATION
                    </small>

                    <b>
                      {formData.location}
                    </b>
                  </div>


                  <div>
                    <small>
                      SEVERITY
                    </small>

                    <b>
                      {formData.severity}/10
                    </b>
                  </div>

                </div>


                <div className="ai-response">

                  {analysis
                    .split('\n')
                    .map((line, index) => {

                      const trimmed = line.trim();

                      if (!trimmed) {
                        return (
                          <div
                            key={index}
                            className="response-space"
                          />
                        );
                      }


                      if (
                        trimmed.startsWith('###')
                      ) {

                        return (
                          <h3 key={index}>
                            {trimmed
                              .replace(/^###\s*/, '')
                              .replace(/\*\*/g, '')}
                          </h3>
                        );

                      }


                      if (
                        trimmed.startsWith('**') &&
                        trimmed.endsWith('**')
                      ) {

                        return (
                          <h3 key={index}>
                            {trimmed.replace(/\*\*/g, '')}
                          </h3>
                        );

                      }


                      if (
                        trimmed.startsWith('* ') ||
                        trimmed.startsWith('- ')
                      ) {

                        return (
                          <div
                            key={index}
                            className="response-bullet"
                          >
                            <i>•</i>

                            <span>
                              {trimmed
                                .replace(/^[-*]\s*/, '')
                                .replace(/\*\*/g, '')}
                            </span>
                          </div>
                        );

                      }


                      return (
                        <p key={index}>
                          {trimmed.replace(/\*\*/g, '')}
                        </p>
                      );

                    })}

                </div>

              </div>

            )}

          </section>

        </div>


        <div className="analyze-footer">

          <span>
            RESQ AI · EMERGENCY INTELLIGENCE PLATFORM
          </span>

          <span>
            AI recommendations should be verified by
            authorized emergency personnel.
          </span>

        </div>

      </main>

    </div>

  );
}


/* =========================
   LOGIN PAGE
========================= */

function Login() {
  const [params] = useSearchParams();

  const [signup, setSignup] = useState(
    params.get('mode') === 'signup'
  );

  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    const endpoint = signup
      ? 'http://127.0.0.1:8000/api/auth/signup'
      : 'http://127.0.0.1:8000/api/auth/login';

    const body = signup
      ? {
          email,
          password,
          organization
        }
      : {
          email,
          password
        };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(
          data.message || 'Authentication failed.'
        );
      }

      if (signup) {
        alert('Account created successfully. Please sign in.');

        setSignup(false);
        setPassword('');
      } else {
        alert('Login successful!');

        localStorage.setItem(
          'resq_user',
          JSON.stringify(data.user)
        );

        nav('/');
      }

    } catch (err) {

      console.error('Authentication error:', err);

      setError(
        err.message ||
        'Unable to connect to the ResQ AI backend.'
      );

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <section className="auth-copy">

          <Logo />

          <div>

            <div className="eyebrow">
              Emergency intelligence
            </div>

            <h1>
              Ready when every second matters.
            </h1>

            <p>
              Secure access to live operational insight,
              coordinated response priorities, and critical
              field intelligence.
            </p>

          </div>

        </section>


        <section className="form">

          <Link
            to="/"
            className="back"
          >
            ← Back to overview
          </Link>


          <h2>
            {signup
              ? 'Create your account'
              : 'Welcome back'}
          </h2>


          <p>
            {signup
              ? 'Start your secure ResQ AI workspace.'
              : 'Sign in to access your operations workspace.'}
          </p>


          <form onSubmit={submit}>

            <label>
              WORK EMAIL
            </label>

            <input
              type="email"
              placeholder="name@organization.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />


            {signup && (
              <>
                <label>
                  ORGANIZATION
                </label>

                <input
                  placeholder="Organization name"
                  value={organization}
                  onChange={(e) =>
                    setOrganization(e.target.value)
                  }
                  required
                />
              </>
            )}


            <label>
              PASSWORD
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />


            {error && (
              <div className="error-box">
                {error}
              </div>
            )}


            <div className="form-actions">

              <label className="check">

                <input type="checkbox" />

                Keep me signed in

              </label>

              {!signup && (
                <a href="#forgot">
                  Forgot password?
                </a>
              )}

            </div>


            <button
              type="submit"
              disabled={loading}
            >

              {loading
                ? 'Please wait...'
                : signup
                  ? 'Create account →'
                  : 'Sign in to ResQ AI →'}

            </button>

          </form>


          <div className="or">
            OR CONTINUE WITH
          </div>


          <button className="sso">
            ⌘ &nbsp; Sign in with organization SSO
          </button>


          <p className="switch">

            {signup
              ? 'Already have an account?'
              : 'New to ResQ AI?'}

            <button
              type="button"
              onClick={() => {
                setSignup(!signup);
                setError('');
              }}
            >

              {signup
                ? 'Sign in'
                : 'Create an account'}

            </button>

          </p>

        </section>

      </div>

    </div>
  );
}
/* =========================
   ROUTES
========================= */
function ProtectedRoute({ children }) {
  const user = localStorage.getItem('resq_user');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>

      {/* Public route */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Protected dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      {/* Protected AI analysis */}
      <Route
        path="/analyze"
        element={
          <ProtectedRoute>
            <AnalyzeDisaster />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);