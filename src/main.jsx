import React from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Coins,
  Gavel,
  LogIn,
  Lock,
  Settings,
  Shield,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import "./styles.css";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const rows = [0, 1, 2, 3, 4, 5, 6];
const columns = [0, 1, 2, 3, 4, 5, 6];
const CONFIG_PASSWORD = "admin123";
const DEFAULT_MATCH_ID = "00000000-0000-4000-8000-000000000001";

const teams = [
  { name: "Alemania", code: "GER" },
  { name: "Argelia", code: "ALG" },
  { name: "Argentina", code: "ARG" },
  { name: "Australia", code: "AUS" },
  { name: "Austria", code: "AUT" },
  { name: "Belgica", code: "BEL" },
  { name: "Bosnia y Herzegovina", code: "BIH" },
  { name: "Brasil", code: "BRA" },
  { name: "Cabo Verde", code: "CPV" },
  { name: "Canada", code: "CAN" },
  { name: "Colombia", code: "COL" },
  { name: "Corea del Sur", code: "KOR" },
  { name: "Costa de Marfil", code: "CIV" },
  { name: "Croacia", code: "CRO" },
  { name: "Curazao", code: "CUW" },
  { name: "Ecuador", code: "ECU" },
  { name: "Egipto", code: "EGY" },
  { name: "Espana", code: "ESP" },
  { name: "Estados Unidos", code: "USA" },
  { name: "Francia", code: "FRA" },
  { name: "Ghana", code: "GHA" },
  { name: "Haiti", code: "HAI" },
  { name: "Inglaterra", code: "ING" },
  { name: "Iran", code: "IRN" },
  { name: "Irak", code: "IRQ" },
  { name: "Japon", code: "JPN" },
  { name: "Jordania", code: "JOR" },
  { name: "Marruecos", code: "MAR" },
  { name: "Mexico", code: "MEX" },
  { name: "Noruega", code: "NOR" },
  { name: "Nueva Zelanda", code: "NZL" },
  { name: "Paises Bajos", code: "NED" },
  { name: "Panama", code: "PAN" },
  { name: "Paraguay", code: "PAR" },
  { name: "Portugal", code: "POR" },
  { name: "Qatar", code: "QAT" },
  { name: "RD Congo", code: "COD" },
  { name: "Republica Checa", code: "CZE" },
  { name: "Arabia Saudita", code: "KSA" },
  { name: "Escocia", code: "SCO" },
  { name: "Senegal", code: "SEN" },
  { name: "Sudafrica", code: "RSA" },
  { name: "Suecia", code: "SWE" },
  { name: "Suiza", code: "SUI" },
  { name: "Tunez", code: "TUN" },
  { name: "Turquia", code: "TUR" },
  { name: "Uruguay", code: "URU" },
  { name: "Uzbekistan", code: "UZB" },
];

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const defaultMatch = {
  id: DEFAULT_MATCH_ID,
  homeTeam: "Colombia",
  homeCode: "COL",
  awayTeam: "Corea del Sur",
  awayCode: "KOR",
  openingDate: todayInputDate(),
  matchTime: "4:00 PM",
  openingTime: "12:00 AM",
  closingTime: "11:59 PM",
};

function App() {
  const [screen, setScreen] = React.useState("cover");
  const [match, setMatch] = React.useState(defaultMatch);
  const [participants, setParticipants] = React.useState([]);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [bids, setBids] = React.useState({});
  const [selectedCell, setSelectedCell] = React.useState(null);
  const [bidAmount, setBidAmount] = React.useState("1000");
  const [bidError, setBidError] = React.useState("");
  const [registration, setRegistration] = React.useState({ name: "", phone: "" });
  const [registrationError, setRegistrationError] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [adminUser, setAdminUser] = React.useState(null);
  const [adminLogin, setAdminLogin] = React.useState({ email: "", password: "" });
  const [adminError, setAdminError] = React.useState("");
  const [winnerQuery, setWinnerQuery] = React.useState({ rowGoal: "0", colGoal: "0" });
  const [reportSearch, setReportSearch] = React.useState("");
  const [now, setNow] = React.useState(() => new Date());
  const [databaseStatus, setDatabaseStatus] = React.useState(isSupabaseConfigured ? "Conectando base de datos..." : "Modo local");
  const [configSaveStatus, setConfigSaveStatus] = React.useState("");

  const totalRaised = Object.values(bids).reduce((sum, bid) => sum + bid.amount, 0);
  const auctionStatus = getAuctionStatus(match, now);
  const isAuctionOpen = auctionStatus.key === "open";
  const report = React.useMemo(() => buildReport(rows, columns, bids, participants), [bids, participants]);
  const selectedWinner = bids[`${winnerQuery.rowGoal}-${winnerQuery.colGoal}`] || null;
  const selectedWinnerTotals = selectedWinner
    ? report.participantTotals.find((participant) => participant.key === selectedWinner.participantId || participant.name === selectedWinner.name)
    : null;
  const filteredSoldCells = React.useMemo(
    () => filterSoldCells(report.soldCells, reportSearch, match),
    [report.soldCells, reportSearch, match],
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    loadStoredData();
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    supabase.auth.getSession().then(({ data }) => setAdminUser(data.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAdminUser(session?.user || null));

    return () => data.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const channel = supabase
      .channel(`auction-${DEFAULT_MATCH_ID}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `id=eq.${DEFAULT_MATCH_ID}` }, (payload) => {
        if (payload.new?.id) setMatch(mapMatchFromDatabase(payload.new));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `match_id=eq.${DEFAULT_MATCH_ID}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setParticipants((current) => current.filter((participant) => participant.id !== payload.old.id));
          return;
        }
        if (payload.new?.id) setParticipants((current) => upsertParticipant(current, mapParticipantFromDatabase(payload.new)));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `match_id=eq.${DEFAULT_MATCH_ID}` }, (payload) => {
        if (payload.eventType === "DELETE") {
          setBids((current) => {
            const next = { ...current };
            delete next[payload.old.cell_key];
            return next;
          });
          return;
        }
        if (payload.new?.cell_key) {
          const { cellKey, bid } = mapBidFromDatabase(payload.new);
          setBids((current) => ({ ...current, [cellKey]: bid }));
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setDatabaseStatus("Supabase conectado en tiempo real");
        if (status === "CHANNEL_ERROR") setDatabaseStatus("Supabase conectado sin tiempo real");
      });

    return () => supabase.removeChannel(channel);
  }, []);

  async function loadStoredData() {
    if (!isSupabaseConfigured) return;

    try {
      const { data: storedMatch, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", DEFAULT_MATCH_ID)
        .maybeSingle();
      if (matchError) throw matchError;

      if (storedMatch) setMatch(mapMatchFromDatabase(storedMatch));
      else await saveMatch(defaultMatch, false);

      const { data: storedParticipants, error: participantsError } = await supabase
        .from("participants")
        .select("*")
        .eq("match_id", DEFAULT_MATCH_ID)
        .order("joined_at", { ascending: true });
      if (participantsError) throw participantsError;
      setParticipants((storedParticipants || []).map(mapParticipantFromDatabase));

      const { data: storedBids, error: bidsError } = await supabase.from("bids").select("*").eq("match_id", DEFAULT_MATCH_ID);
      if (bidsError) throw bidsError;
      setBids(mapBidsFromDatabase(storedBids || []));
      setDatabaseStatus("Supabase conectado");
    } catch (error) {
      console.error(error);
      setDatabaseStatus("Modo local: revise Supabase");
    }
  }

  async function saveMatch(matchToSave = match, showStatus = true) {
    if (!isSupabaseConfigured) {
      if (showStatus) setConfigSaveStatus("Guardado localmente");
      return true;
    }

    if (!adminUser) {
      if (showStatus) setConfigSaveStatus("Inicie sesion como administrador");
      return false;
    }

    const { error } = await supabase.from("matches").upsert(mapMatchToDatabase(matchToSave), { onConflict: "id" });
    if (error) {
      console.error(error);
      if (showStatus) setConfigSaveStatus("No se pudo guardar en Supabase");
      return false;
    }

    if (showStatus) setConfigSaveStatus("Configuracion guardada en Supabase");
    setDatabaseStatus("Supabase conectado");
    return true;
  }

  function goToConfig() {
    if (isSupabaseConfigured) {
      setScreen(adminUser ? "config" : "admin-login");
      return;
    }

    if (password === CONFIG_PASSWORD) {
      setPassword("");
      setPasswordError("");
      setScreen("config");
      return;
    }

    setPasswordError("Contrasena incorrecta");
  }

  async function signInAdmin(event) {
    event.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminLogin.email.trim(),
      password: adminLogin.password,
    });

    if (error) {
      setAdminError("No se pudo iniciar sesion como administrador");
      return;
    }

    setAdminUser(data.user);
    setAdminLogin({ email: "", password: "" });
    setAdminError("");
    setScreen("config");
  }

  async function signOutAdmin() {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setAdminUser(null);
    setScreen("cover");
  }

  function updateTeam(side, teamName) {
    const team = teams.find((item) => item.name === teamName);
    if (!team) return;
    setMatch((current) => ({ ...current, [`${side}Team`]: team.name, [`${side}Code`]: team.code }));
  }

  function goToAuction() {
    setScreen(currentUser ? "auction" : "register");
  }

  async function saveConfigAndGoToAuction() {
    await saveMatch();
    goToAuction();
  }

  async function saveParticipant(event) {
    event.preventDefault();
    const name = registration.name.trim();
    const phone = registration.phone.trim();

    if (!name || !phone) {
      setRegistrationError("Ingrese nombre y celular para inscribirse");
      return;
    }

    let participant = { id: crypto.randomUUID(), name, phone, joinedAt: new Date().toISOString() };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("participants")
        .insert({ match_id: DEFAULT_MATCH_ID, name, phone })
        .select("*")
        .single();

      if (error) {
        const { data: existingParticipant, error: existingError } = await supabase
          .from("participants")
          .select("*")
          .eq("match_id", DEFAULT_MATCH_ID)
          .eq("phone", phone)
          .maybeSingle();

        if (existingError || !existingParticipant) {
          console.error(error);
          setRegistrationError("No se pudo guardar la inscripcion");
          return;
        }
        participant = mapParticipantFromDatabase(existingParticipant);
      } else {
        participant = mapParticipantFromDatabase(data);
      }
    }

    setParticipants((current) => upsertParticipant(current, participant));
    setCurrentUser(participant);
    setRegistration({ name: "", phone: "" });
    setRegistrationError("");
    setScreen("auction");
  }

  function openBid(cellKey, rowGoal, colGoal) {
    if (!isAuctionOpen) {
      setBidError("La subasta no esta abierta en este momento");
      return;
    }

    setSelectedCell({ key: cellKey, rowGoal, colGoal });
    setBidAmount(String(Math.max((bids[cellKey]?.amount || 0) + 1000, 1000)));
    setBidError("");
  }

  async function saveBid(event) {
    event.preventDefault();
    if (!currentUser || !selectedCell) return;

    const amount = Number(bidAmount);
    const minimumAmount = Math.max((bids[selectedCell.key]?.amount || 0) + 1000, 1000);
    if (!Number.isFinite(amount) || amount < minimumAmount) {
      setBidError(`La puja minima es ${currency.format(minimumAmount)}`);
      return;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.rpc("place_bid", {
        p_match_id: DEFAULT_MATCH_ID,
        p_cell_key: selectedCell.key,
        p_row_goal: selectedCell.rowGoal,
        p_col_goal: selectedCell.colGoal,
        p_participant_id: currentUser.id,
        p_amount: amount,
      });

      if (error) {
        console.error(error);
        setBidError(error.message || "No se pudo guardar la puja");
        return;
      }

      const mappedBid = mapBidFromDatabase(data);
      setBids((current) => ({ ...current, [mappedBid.cellKey]: mappedBid.bid }));
    } else {
      setBids((current) => ({
        ...current,
        [selectedCell.key]: { participantId: currentUser.id, name: currentUser.name, amount },
      }));
    }

    setSelectedCell(null);
    setBidError("");
  }

  function exportReport() {
    const csv = buildReportCsv(match, report);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-${match.homeCode}-vs-${match.awayCode}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (screen === "cover") {
    return (
      <main className="app-shell cover-shell">
        <section className="cover">
          <div className="cover-copy">
            <span className="eyebrow"><Trophy size={16} /> Subasta mundialista</span>
            <h1>Subasta de marcadores</h1>
            <p>Administra el partido, abre la subasta y permite que cada participante compita por el marcador exacto.</p>
          </div>

          <div className="cover-actions">
            <button className="cover-button auction" type="button" onClick={goToAuction}>
              <Gavel size={28} />
              <span>Subasta</span>
              <small>{currentUser ? `${currentUser.name} inscrito` : `${match.homeCode} vs ${match.awayCode}`}</small>
            </button>

            <div className="config-access">
              <button className="cover-button config" type="button" onClick={goToConfig}>
                <Settings size={28} />
                <span>Configuracion</span>
                <small>{isSupabaseConfigured ? "Login administrador" : "Requiere contrasena"}</small>
              </button>
              {!isSupabaseConfigured && (
                <>
                  <label className="password-field">
                    <Lock size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") goToConfig();
                      }}
                      placeholder="Contrasena"
                    />
                  </label>
                  {passwordError && <strong className="form-error">{passwordError}</strong>}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "admin-login") {
    return (
      <main className="app-shell">
        <section className="register-page">
          <button className="back-button" type="button" onClick={() => setScreen("cover")}><ArrowLeft size={18} /> Volver</button>
          <div className="register-layout">
            <div>
              <span className="eyebrow"><Lock size={16} /> Acceso administrador</span>
              <h1>Configuracion segura</h1>
              <p>Inicie sesion con el usuario administrador creado en Supabase para modificar equipos, fecha y horarios.</p>
            </div>
            <form className="register-form" onSubmit={signInAdmin}>
              <label>Correo administrador
                <input type="email" value={adminLogin.email} onChange={(event) => setAdminLogin((current) => ({ ...current, email: event.target.value }))} placeholder="admin@empresa.com" />
              </label>
              <label>Contrasena
                <input type="password" value={adminLogin.password} onChange={(event) => setAdminLogin((current) => ({ ...current, password: event.target.value }))} placeholder="Contrasena" />
              </label>
              {adminError && <strong className="form-error">{adminError}</strong>}
              <button className="primary-button full" type="submit"><LogIn size={18} /> Entrar a configuracion</button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "register") {
    return (
      <main className="app-shell">
        <section className="register-page">
          <button className="back-button" type="button" onClick={() => setScreen("cover")}><ArrowLeft size={18} /> Volver</button>
          <div className="register-layout">
            <div>
              <span className="eyebrow"><UserPlus size={16} /> Inscripcion abierta</span>
              <h1>Registro de participante</h1>
              <p>Cualquier persona con el link puede inscribirse para entrar a la subasta del partido {match.homeTeam} vs {match.awayTeam}.</p>
            </div>
            <form className="register-form" onSubmit={saveParticipant}>
              <label>Nombre completo
                <input type="text" value={registration.name} onChange={(event) => setRegistration((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Jose Perez" />
              </label>
              <label>Celular
                <input type="tel" value={registration.phone} onChange={(event) => setRegistration((current) => ({ ...current, phone: event.target.value }))} placeholder="Ej. 3001234567" />
              </label>
              {registrationError && <strong className="form-error">{registrationError}</strong>}
              <button className="primary-button full" type="submit"><UserPlus size={18} /> Entrar a la subasta</button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "config") {
    return (
      <main className="app-shell">
        <section className="config-page">
          <button className="back-button" type="button" onClick={() => setScreen("cover")}><ArrowLeft size={18} /> Volver</button>
          <div className="section-heading">
            <div>
              <span className="eyebrow compact"><Settings size={15} /> Configuracion</span>
              <h2>Informacion del partido</h2>
              <p>Seleccione equipos, fecha, hora del partido y ventana de pujas en horario Colombia.</p>
            </div>
            {isSupabaseConfigured && <button className="secondary-button" type="button" onClick={signOutAdmin}>Cerrar sesion</button>}
          </div>

          <div className="config-grid">
            <label>Equipo eje Y
              <select value={match.homeTeam} onChange={(event) => updateTeam("home", event.target.value)}>
                {teams.map((team) => <option key={team.code} value={team.name}>{team.name} ({team.code})</option>)}
              </select>
            </label>
            <label>Equipo eje X
              <select value={match.awayTeam} onChange={(event) => updateTeam("away", event.target.value)}>
                {teams.map((team) => <option key={team.code} value={team.name}>{team.name} ({team.code})</option>)}
              </select>
            </label>
            <label>Fecha
              <span className="field-with-icon"><CalendarDays size={16} /><input type="date" value={match.openingDate} onChange={(event) => setMatch((current) => ({ ...current, openingDate: event.target.value }))} /></span>
            </label>
            <label>Hora del partido
              <span className="field-with-icon"><Clock size={16} /><input type="time" value={toInputTime(match.matchTime)} onChange={(event) => setMatch((current) => ({ ...current, matchTime: formatTime(event.target.value) }))} /></span>
            </label>
            <label>Hora de apertura
              <span className="field-with-icon"><Clock size={16} /><input type="time" value={toInputTime(match.openingTime)} onChange={(event) => setMatch((current) => ({ ...current, openingTime: formatTime(event.target.value) }))} /></span>
            </label>
            <label>Hora de cierre
              <span className="field-with-icon"><Clock size={16} /><input type="time" value={toInputTime(match.closingTime)} onChange={(event) => setMatch((current) => ({ ...current, closingTime: formatTime(event.target.value) }))} /></span>
            </label>
          </div>

          <div className="config-footer">
            <span>{configSaveStatus || databaseStatus}</span>
            <button className="secondary-button" type="button" onClick={() => saveMatch()}>Guardar configuracion</button>
            <button className="primary-button" type="button" onClick={saveConfigAndGoToAuction}>Ir a subasta</button>
          </div>

          <ReportPanel
            match={match}
            report={report}
            totalRaised={totalRaised}
            participants={participants}
            winnerQuery={winnerQuery}
            setWinnerQuery={setWinnerQuery}
            selectedWinner={selectedWinner}
            selectedWinnerTotals={selectedWinnerTotals}
            filteredSoldCells={filteredSoldCells}
            reportSearch={reportSearch}
            setReportSearch={setReportSearch}
            exportReport={exportReport}
          />
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <button className="back-button floating" type="button" onClick={() => setScreen("cover")}><ArrowLeft size={18} /> Portada</button>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><Trophy size={16} /> Polla mundialista tipo subasta</span>
          <h1>Subasta de marcadores</h1>
          <p>Selecciona una casilla y puja por el marcador exacto. El ganador del resultado se lleva todo lo recaudado.</p>
        </div>
        <div className="match-panel">
          <div className="status-row"><span className="live-dot" /> {auctionStatus.label}</div>
          <span className="database-pill">{databaseStatus}</span>
          <div className="teams">
            <article className="team-card"><Shield size={22} /><span>{match.homeTeam}</span></article>
            <strong>VS</strong>
            <article className="team-card"><Shield size={22} /><span>{match.awayTeam}</span></article>
          </div>
          <div className="stats-grid">
            <article><Coins size={20} /><span>Total recaudado</span><strong>{currency.format(totalRaised)}</strong></article>
            <article><Users size={20} /><span>Participantes</span><strong>{participants.length}</strong></article>
            <article><Clock size={20} /><span>Fecha Colombia</span><strong>{match.openingDate}</strong></article>
            <article><Clock size={20} /><span>Partido</span><strong>{match.matchTime}</strong></article>
            <article><Clock size={20} /><span>Apertura</span><strong>{match.openingTime}</strong></article>
            <article><Clock size={20} /><span>Cierre</span><strong>{match.closingTime}</strong></article>
          </div>
        </div>
      </section>

      {currentUser && (
        <div className="current-user-bar">
          <span>Participante: <strong>{currentUser.name}</strong></span>
          <button type="button" onClick={() => setScreen("register")}>Cambiar usuario</button>
        </div>
      )}

      <section className="workspace">
        <div className="section-heading">
          <div>
            <span className="eyebrow compact"><Gavel size={15} /> Matriz de resultados</span>
            <h2>{match.homeTeam} vs {match.awayTeam}</h2>
          </div>
          <button className="primary-button" type="button" disabled={!isAuctionOpen}><Gavel size={18} /> {isAuctionOpen ? `Pujar desde ${currency.format(1000)}` : "Pujas bloqueadas"}</button>
        </div>

        <div className="matrix-wrap" aria-label="Matriz de subasta por marcador exacto">
          <div className="matrix">
            <div className="corner-cell"><span className="axis-title axis-x">{match.awayCode}</span><span className="axis-title axis-y">{match.homeCode}</span></div>
            {columns.map((goal) => <div className="score-head column-head" key={`col-${goal}`}><span>{match.awayCode}</span>{goal}</div>)}
            {rows.map((rowGoal) => (
              <React.Fragment key={`row-${rowGoal}`}>
                <div className="score-head row-head"><span>{match.homeCode}</span>{rowGoal}</div>
                {columns.map((colGoal) => {
                  const key = `${rowGoal}-${colGoal}`;
                  const bid = bids[key];
                  return (
                    <button className={`${bid ? "bid-cell occupied" : "bid-cell"} ${isAuctionOpen ? "" : "locked"}`} disabled={!isAuctionOpen} key={key} type="button" onClick={() => openBid(key, rowGoal, colGoal)}>
                      <span className="score-label">{match.homeCode} {rowGoal} - {colGoal} {match.awayCode}</span>
                      {bid ? <><strong>{bid.name}</strong><small>{currency.format(bid.amount)}</small></> : <small>Libre</small>}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {selectedCell && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedCell(null)}>
          <form className="bid-modal" onSubmit={saveBid} onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setSelectedCell(null)}>x</button>
            <span className="eyebrow compact"><Gavel size={15} /> Nueva puja</span>
            <h2>{match.homeCode} {selectedCell.rowGoal} - {selectedCell.colGoal} {match.awayCode}</h2>
            <p>Participante: <strong>{currentUser.name}</strong></p>
            {bids[selectedCell.key] && <div className="current-bid"><span>Puja actual</span><strong>{bids[selectedCell.key].name} - {currency.format(bids[selectedCell.key].amount)}</strong></div>}
            <label>Valor de la puja
              <input type="number" min={Math.max((bids[selectedCell.key]?.amount || 0) + 1000, 1000)} step="1000" value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} />
            </label>
            {bidError && <strong className="form-error">{bidError}</strong>}
            <button className="primary-button full" type="submit"><Gavel size={18} /> Guardar puja</button>
          </form>
        </div>
      )}
    </main>
  );
}

function ReportPanel({ match, report, totalRaised, participants, winnerQuery, setWinnerQuery, selectedWinner, selectedWinnerTotals, filteredSoldCells, reportSearch, setReportSearch, exportReport }) {
  return (
    <section className="report-panel">
      <div className="section-heading report-heading">
        <div>
          <span className="eyebrow compact"><Coins size={15} /> Reportes</span>
          <h2>Resumen administrativo</h2>
        </div>
        <button className="secondary-button" type="button" onClick={exportReport}>Exportar CSV</button>
      </div>

      <div className="report-summary">
        <article><span>Total recaudado</span><strong>{currency.format(totalRaised)}</strong></article>
        <article><span>Casillas vendidas</span><strong>{report.soldCells.length}</strong></article>
        <article><span>Casillas libres</span><strong>{report.freeCells.length}</strong></article>
        <article><span>Participantes</span><strong>{participants.length}</strong></article>
      </div>

      <article className="winner-lookup">
        <div>
          <h3>Consultar ganador por marcador</h3>
          <p>Seleccione el resultado final para saber quien gana y cuanto se lleva.</p>
        </div>
        <div className="winner-controls">
          <label>{match.homeCode}<select value={winnerQuery.rowGoal} onChange={(event) => setWinnerQuery((current) => ({ ...current, rowGoal: event.target.value }))}>{rows.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select></label>
          <label>{match.awayCode}<select value={winnerQuery.colGoal} onChange={(event) => setWinnerQuery((current) => ({ ...current, colGoal: event.target.value }))}>{columns.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select></label>
        </div>
        <div className={selectedWinner ? "winner-result sold" : "winner-result"}>
          <span>{match.homeCode} {winnerQuery.rowGoal} - {winnerQuery.colGoal} {match.awayCode}</span>
          {selectedWinner ? (
            <div className="winner-detail-grid">
              <div><small>Ganador actual</small><strong>{selectedWinner.name}</strong></div>
              <div><small>Valor pagado</small><strong>{currency.format(selectedWinner.amount)}</strong></div>
              <div><small>Premio si acierta</small><strong>{currency.format(totalRaised)}</strong></div>
              <div><small>Casillas del participante</small><strong>{selectedWinnerTotals?.cells || 1}</strong></div>
            </div>
          ) : <strong>Casilla libre</strong>}
        </div>
      </article>

      <div className="report-columns">
        <article className="report-card">
          <div className="report-card-header">
            <h3>Ganadores por casilla</h3>
            <input type="search" value={reportSearch} onChange={(event) => setReportSearch(event.target.value)} placeholder="Buscar marcador o usuario" />
          </div>
          {filteredSoldCells.length ? (
            <div className="report-table-wrap">
              <table>
                <thead><tr><th>Marcador</th><th>Usuario</th><th>Valor pagado</th></tr></thead>
                <tbody>{filteredSoldCells.map((cell) => <tr key={cell.key}><td>{match.homeCode} {cell.rowGoal} - {cell.colGoal} {match.awayCode}</td><td>{cell.name}</td><td>{currency.format(cell.amount)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p>No hay casillas vendidas todavia.</p>}
        </article>

        <article className="report-card">
          <h3>Total por participante</h3>
          {report.participantTotals.length ? (
            <div className="report-table-wrap">
              <table>
                <thead><tr><th>Usuario</th><th>Casillas</th><th>Total</th></tr></thead>
                <tbody>{report.participantTotals.map((participant) => <tr key={participant.key}><td>{participant.name}</td><td>{participant.cells}</td><td>{currency.format(participant.total)}</td></tr>)}</tbody>
              </table>
            </div>
          ) : <p>No hay recaudo por participante todavia.</p>}
        </article>
      </div>
    </section>
  );
}

function formatTime(value) {
  if (!value) return "";
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const period = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${period}`;
}

function toInputTime(value) {
  if (!value) return "";
  const [time, period] = value.split(" ");
  const [hourText, minute] = time.split(":");
  let hour = Number(hourText);
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function mapMatchToDatabase(match) {
  return {
    id: DEFAULT_MATCH_ID,
    home_team: match.homeTeam,
    home_code: match.homeCode,
    away_team: match.awayTeam,
    away_code: match.awayCode,
    opening_date: match.openingDate,
    match_time: match.matchTime,
    opening_time: match.openingTime,
    closing_time: match.closingTime,
    updated_at: new Date().toISOString(),
  };
}

function mapMatchFromDatabase(match) {
  return {
    id: match.id,
    homeTeam: match.home_team,
    homeCode: match.home_code,
    awayTeam: match.away_team,
    awayCode: match.away_code,
    openingDate: match.opening_date,
    matchTime: match.match_time,
    openingTime: match.opening_time,
    closingTime: match.closing_time,
  };
}

function mapParticipantFromDatabase(participant) {
  return { id: participant.id, name: participant.name, phone: participant.phone, joinedAt: participant.joined_at };
}

function upsertParticipant(participants, participant) {
  const exists = participants.some((item) => item.id === participant.id || item.phone === participant.phone);
  if (!exists) return [...participants, participant];
  return participants.map((item) => (item.id === participant.id || item.phone === participant.phone ? participant : item));
}

function mapBidFromDatabase(bid) {
  return {
    cellKey: bid.cell_key,
    bid: { participantId: bid.participant_id, name: bid.participant_name, amount: bid.amount },
  };
}

function mapBidsFromDatabase(bids) {
  return bids.reduce((accumulator, bid) => {
    const mappedBid = mapBidFromDatabase(bid);
    accumulator[mappedBid.cellKey] = mappedBid.bid;
    return accumulator;
  }, {});
}

function buildReport(rows, columns, bids, participants) {
  const allCells = rows.flatMap((rowGoal) =>
    columns.map((colGoal) => {
      const key = `${rowGoal}-${colGoal}`;
      const bid = bids[key];
      return { key, rowGoal, colGoal, ...bid, sold: Boolean(bid) };
    }),
  );
  const soldCells = allCells.filter((cell) => cell.sold);
  const freeCells = allCells.filter((cell) => !cell.sold);
  const totalsByParticipant = soldCells.reduce((accumulator, cell) => {
    const key = cell.participantId || cell.name;
    if (!accumulator[key]) accumulator[key] = { key, name: cell.name, cells: 0, total: 0 };
    accumulator[key].cells += 1;
    accumulator[key].total += cell.amount;
    return accumulator;
  }, {});

  return {
    allCells,
    soldCells,
    freeCells,
    participantTotals: Object.values(totalsByParticipant).sort((a, b) => b.total - a.total),
    participants,
  };
}

function filterSoldCells(cells, search, match) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return cells;

  return cells.filter((cell) => {
    const score = `${match.homeCode} ${cell.rowGoal} - ${cell.colGoal} ${match.awayCode}`.toLowerCase();
    const simpleScore = `${cell.rowGoal}-${cell.colGoal}`;
    const name = (cell.name || "").toLowerCase();
    return score.includes(normalizedSearch) || simpleScore.includes(normalizedSearch) || name.includes(normalizedSearch);
  });
}

function buildReportCsv(match, report) {
  const prize = report.soldCells.reduce((sum, cell) => sum + cell.amount, 0);
  const rows = [
    ["Reporte", `${match.homeTeam} vs ${match.awayTeam}`],
    ["Fecha", match.openingDate],
    ["Hora partido", match.matchTime],
    [],
    ["Casillas vendidas"],
    ["Marcador", "Usuario", "Valor pagado", "Premio si acierta"],
    ...report.soldCells.map((cell) => [`${match.homeCode} ${cell.rowGoal} - ${cell.colGoal} ${match.awayCode}`, cell.name, cell.amount, prize]),
    [],
    ["Casillas libres"],
    ["Marcador"],
    ...report.freeCells.map((cell) => [`${match.homeCode} ${cell.rowGoal} - ${cell.colGoal} ${match.awayCode}`]),
    [],
    ["Totales por participante"],
    ["Usuario", "Casillas", "Total"],
    ...report.participantTotals.map((participant) => [participant.name, participant.cells, participant.total]),
    [],
    ["Participantes inscritos"],
    ["Nombre", "Celular"],
    ...report.participants.map((participant) => [participant.name, participant.phone]),
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value = "") {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function todayInputDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function getAuctionStatus(match, now) {
  const opening = combineDateAndTime(match.openingDate, match.openingTime);
  const closing = combineDateAndTime(match.openingDate, match.closingTime);
  if (!opening || !closing) return { key: "pending", label: "Subasta sin horario" };
  if (now < opening) return { key: "pending", label: "Subasta pendiente" };
  if (now > closing) return { key: "closed", label: "Subasta cerrada" };
  return { key: "open", label: "Subasta abierta" };
}

function combineDateAndTime(date, time) {
  const inputTime = toInputTime(time);
  if (!date || !inputTime) return null;
  const [hour, minute] = inputTime.split(":").map(Number);
  const combined = new Date(`${date}T00:00:00`);
  combined.setHours(hour, minute, 0, 0);
  return combined;
}

createRoot(document.getElementById("root")).render(<App />);
