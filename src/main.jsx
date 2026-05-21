import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Calculator, Flame, GitBranch, RotateCcw, Beaker, Wind, TestTube2,
  Droplets, Factory, Moon, Sun, Thermometer, AlertTriangle, BookOpen
} from "lucide-react";
import "./style.css";

const WATER_DENSITY = 1000;
const R = 8.314472;

const conversions = {
  Pressure: { Pa: 1, kPa: 1000, bar: 100000, atm: 101325, psi: 6894.757, mmHg: 133.322 },
  Energy: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Btu: 1055.06 },
  Temperature: { C: "C", K: "K", F: "F" },
  Mass: { g: 0.001, kg: 1, lbm: 0.45359237 },
  Volume: { L: 0.001, m3: 1, cm3: 1e-6, ft3: 0.0283168 },
  Flowrate: { "kg/s": 1, "kg/h": 1 / 3600, "g/s": 0.001, "lbm/h": 0.45359237 / 3600 },
};

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}
function fmt(value, digits = 4) {
  if (!Number.isFinite(value)) return "ERROR";
  if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.001)) return value.toExponential(4);
  return Number(value.toFixed(digits)).toString();
}
function tempToC(value, unit) {
  if (unit === "C") return value;
  if (unit === "K") return value - 273.15;
  if (unit === "F") return (value - 32) * 5 / 9;
  return value;
}
function cToTemp(value, unit) {
  if (unit === "C") return value;
  if (unit === "K") return value + 273.15;
  if (unit === "F") return value * 9 / 5 + 32;
  return value;
}
function toFraction(value) {
  const v = number(value);
  if (!Number.isFinite(v)) return { error: true, value: NaN, message: "Invalid number." };
  if (v < 0 || v > 100) return { error: true, value: NaN, message: "Fraction must be 0–1 or 0%–100%." };
  if (v <= 1) return { error: false, value: v, label: `${v}` };
  return { error: false, value: v / 100, label: `${v}% = ${fmt(v / 100)}` };
}
function invalidNegative(label, value) {
  const v = number(value);
  if (!Number.isFinite(v)) return `${label} must be a valid number.`;
  if (v < 0) return `${label} cannot be less than 0.`;
  return "";
}
function celsiusToKelvin(c) { return number(c) + 273.15; }
function kelvinError(label, kelvin) {
  if (!Number.isFinite(kelvin)) return `${label} must be a valid temperature.`;
  if (kelvin < 0) return `${label} cannot be less than 0 K.`;
  return "";
}

function LogoMark({ dark }) {
  return <div className="logo-mark">
    <div className="logo-neck" />
    <div className="logo-flask" />
    <div className="logo-liquid" />
    <div className="logo-text">ΔH</div>
  </div>;
}
function Header({ title, text }) {
  return <div className="section-header"><h2>{title}</h2><p>{text}</p></div>;
}
function AlertBox({ children }) {
  if (!children) return null;
  return <div className="alert"><AlertTriangle size={18} /> <span>{children}</span></div>;
}
function Reference({ items }) {
  return <div className="reference"><div className="ref-title"><BookOpen size={16}/> Equation Reference</div><ul>{items.map((x,i)=><li key={i}>{x}</li>)}</ul></div>;
}
function Input({ label, value, setValue, unit }) {
  return <label className="field"><span>{label}</span><div className="input-wrap"><input value={value} onChange={e=>setValue(e.target.value)} type="number" step="any" />{unit && <em>{unit}</em>}</div></label>;
}
function Select({ label, value, setValue, options }) {
  return <label className="field"><span>{label}</span><select value={value} onChange={e=>setValue(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>;
}
function ResultBox({ title, children }) {
  return <div className="result"><b>{title}</b><pre>{children}</pre></div>;
}
function Card({ children }) { return <div className="card">{children}</div>; }
function SectionButton({ active, onClick, icon: Icon, title, subtitle }) {
  return <button onClick={onClick} className={`side-btn ${active ? "active" : ""}`}><span className="side-icon"><Icon size={20}/></span><span><b>{title}</b><small>{subtitle}</small></span></button>
}

function UnitConverter() {
  const [category, setCategory] = useState("Pressure");
  const units = Object.keys(conversions[category]);
  const [from, setFrom] = useState(units[0]);
  const [to, setTo] = useState(units[1] || units[0]);
  const [value, setValue] = useState("1");
  React.useEffect(() => { const u = Object.keys(conversions[category]); setFrom(u[0]); setTo(u[1] || u[0]); }, [category]);
  const result = useMemo(() => {
    const v = number(value);
    if (!Number.isFinite(v)) return NaN;
    if (category === "Temperature") return cToTemp(tempToC(v, from), to);
    return (v * conversions[category][from]) / conversions[category][to];
  }, [category, from, to, value]);
  return <Card><Header title="Unit Converter" text="Chapter 3 style unit conversion."/>
    <Reference items={["Units must cancel correctly.", "Temperature conversion is handled separately.", "Negative values are allowed only where physically meaningful."]}/>
    <div className="grid4"><Select label="Category" value={category} setValue={setCategory} options={Object.keys(conversions)} /><Input label="Value" value={value} setValue={setValue}/><Select label="From" value={from} setValue={setFrom} options={Object.keys(conversions[category])}/><Select label="To" value={to} setValue={setTo} options={Object.keys(conversions[category])}/></div>
    <ResultBox title="Final Answer">{`${value} ${from} = ${fmt(result)} ${to}`}</ResultBox>
  </Card>
}

function SGMoles() {
  const [sg,setSg]=useState("13.546"), [vol,setVol]=useState("175"), [mw,setMw]=useState("200.61");
  const errors = [invalidNegative("Specific gravity",sg), invalidNegative("Volume",vol), invalidNegative("Molecular weight",mw)].filter(Boolean);
  if (number(mw)===0) errors.push("Molecular weight cannot be zero.");
  const error = errors[0] || "";
  const rho = error ? NaN : number(sg)*WATER_DENSITY, mass = error ? NaN : rho*number(vol), kmol = error ? NaN : mass/number(mw);
  return <Card><Header title="SG → Density → Mass → kmol" text="Specific gravity and mole calculation."/>
    <Reference items={["ρmaterial = SG × ρwater", "m = ρV", "n = m/MW", "Mass, volume, and moles cannot be negative."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Input label="Specific Gravity" value={sg} setValue={setSg}/><Input label="Volume" value={vol} setValue={setVol} unit="m³"/><Input label="MW" value={mw} setValue={setMw} unit="kg/kmol"/></div>
    <ResultBox title="Solution Steps">{`ρ = ${sg} × 1000 = ${fmt(rho)} kg/m³
m = ρV = ${fmt(rho)} × ${vol} = ${fmt(mass)} kg
n = m/MW = ${fmt(mass)} / ${mw} = ${fmt(kmol)} kmol`}</ResultBox>
  </Card>
}

function CompositionSolver() {
  const [mA,setMA]=useState("65"),[mB,setMB]=useState("35"),[mwA,setMwA]=useState("78.11"),[mwB,setMwB]=useState("92.14");
  const errors=[invalidNegative("Mass A",mA),invalidNegative("Mass B",mB),invalidNegative("MW A",mwA),invalidNegative("MW B",mwB)].filter(Boolean);
  if(number(mwA)===0||number(mwB)===0) errors.push("Molecular weight cannot be zero.");
  const error=errors[0]||"";
  const nA=error?NaN:number(mA)/number(mwA), nB=error?NaN:number(mB)/number(mwB);
  const wA=error?NaN:number(mA)/(number(mA)+number(mB)), yA=error?NaN:nA/(nA+nB);
  return <Card><Header title="Mass Fraction ↔ Mole Fraction" text="Binary mixture composition conversion."/>
    <Reference items={["Mass fraction = component mass / total mass", "Mole fraction = component moles / total moles", "Fractions must be 0–1 or 0%–100%.", "Mass and moles cannot be negative."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid4"><Input label="Mass A" value={mA} setValue={setMA}/><Input label="Mass B" value={mB} setValue={setMB}/><Input label="MW A" value={mwA} setValue={setMwA}/><Input label="MW B" value={mwB} setValue={setMwB}/></div>
    <ResultBox title="Final Answer">{`Mass fractions: A = ${fmt(wA)}, B = ${fmt(1-wA)}
Mole fractions: A = ${fmt(yA)}, B = ${fmt(1-yA)}`}</ResultBox>
  </Card>
}

function TankBalance() {
  const [input,setInput]=useState("6"),[output,setOutput]=useState("3"),[volume,setVolume]=useState("1");
  const errors=[invalidNegative("Input flowrate",input),invalidNegative("Output flowrate",output),invalidNegative("Volume",volume)].filter(Boolean);
  const acc=number(input)-number(output);
  if(!errors.length && acc<=0) errors.push("Input must be greater than output for filling/overflow time.");
  const error=errors[0]||"";
  const time=error?NaN:WATER_DENSITY*number(volume)/acc;
  return <Card><Header title="Unsteady Tank Balance" text="Input - Output = Accumulation."/>
    <Reference items={["Accumulation = Input − Output", "Δm = ρΔV", "Δt = Δm/Accumulation", "Flowrates cannot be negative."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Input label="Input" value={input} setValue={setInput} unit="kg/s"/><Input label="Output" value={output} setValue={setOutput} unit="kg/s"/><Input label="Volume to fill" value={volume} setValue={setVolume} unit="m³"/></div>
    <ResultBox title="Final Answer">{`Accumulation = ${input} - ${output} = ${fmt(acc)} kg/s
Time = 1000 × ${volume} / ${fmt(acc)} = ${fmt(time)} s = ${fmt(time/60)} min`}</ResultBox>
  </Card>
}

function MaterialBalance() {
  const [feed,setFeed]=useState("100"),[xA,setXA]=useState("0.40"),[conv,setConv]=useState("75");
  const xf=toFraction(xA), cf=toFraction(conv);
  const errors=[invalidNegative("Feed",feed)].filter(Boolean);
  if(xf.error) errors.push("Mole fraction must be 0–1 or 0%–100%.");
  if(cf.error) errors.push("Conversion must be 0–1 or 0%–100%.");
  const error=errors[0]||"";
  const F=error?NaN:number(feed), xa=error?NaN:xf.value, X=error?NaN:cf.value, xb=error?NaN:1-xa;
  const AIn=F*xa, BIn=F*xb, AReacted=AIn*X, AOut=AIn-AReacted, COut=AReacted;
  return <Card><Header title="Simple Reactive Material Balance" text="A → C with inert B."/>
    <Reference items={["x and y fractions accept 0–1 or 0%–100%.", "A reacted = A in × conversion", "A out = A in − A reacted", "Negative mass/moles are blocked."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Input label="Feed" value={feed} setValue={setFeed} unit="mol/h"/><Input label="xA" value={xA} setValue={setXA} unit="0–1 or %"/><Input label="Conversion" value={conv} setValue={setConv} unit="0–1 or %"/></div>
    <ResultBox title="Solution">{`xA = ${xf.error ? "ERROR" : xf.label}
X = ${cf.error ? "ERROR" : cf.label}
A in = ${fmt(AIn)}
B in = ${fmt(BIn)}
A reacted = ${fmt(AReacted)}
A out = ${fmt(AOut)}
C out = ${fmt(COut)}`}</ResultBox>
  </Card>
}

function StoichSolver() {
  const [a,setA]=useState("2"),[b,setB]=useState("1"),[nA,setNA]=useState("30"),[nB,setNB]=useState("80"),[extent,setExtent]=useState("0");
  const errors=[invalidNegative("Coefficient a",a),invalidNegative("Coefficient b",b),invalidNegative("Moles A",nA),invalidNegative("Moles B",nB),invalidNegative("Extent",extent)].filter(Boolean);
  if(number(a)===0||number(b)===0) errors.push("Stoichiometric coefficients cannot be zero.");
  const error=errors[0]||"";
  const bSt=error?NaN:number(nA)*number(b)/number(a), bEx=!error&&number(nB)>bSt, exPct=error?NaN:(number(nB)-bSt)/bSt*100;
  return <Card><Header title="Limiting / Excess Reactant" text="aA + bB → products."/>
    <Reference items={["Required B = nA × b/a", "Moles cannot be negative.", "Extent is blocked from being negative in this BASIC-A version.", "Reverse reaction/equilibrium extent may be added later."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid5"><Input label="a" value={a} setValue={setA}/><Input label="b" value={b} setValue={setB}/><Input label="nA" value={nA} setValue={setNA}/><Input label="nB" value={nB} setValue={setNB}/><Input label="Extent ξ" value={extent} setValue={setExtent}/></div>
    <ResultBox title="Final Answer">{`Required B(stoich) = ${fmt(bSt)}
${bEx ? "B is excess, A is limiting." : "B is limiting, A is excess."}
Excess % = ${fmt(exPct)}%`}</ResultBox>
  </Card>
}

function IdealGas() {
  const [P,setP]=useState("122"),[V,setV]=useState("1.25"),[T,setT]=useState("150");
  const TK=celsiusToKelvin(T);
  const errors=[invalidNegative("Pressure",P),invalidNegative("Volume",V),kelvinError("Temperature",TK)].filter(Boolean);
  const error=errors[0]||"";
  const n=error?NaN:number(P)*(number(V)*1000)/(R*TK);
  return <Card><Header title="Ideal Gas Solver" text="PV = nRT."/>
    <Reference items={["P must be absolute.", "T(K) = T(°C) + 273.15", "Temperature in Kelvin cannot be less than 0.", "Pressure/volume cannot be negative."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Input label="Pressure" value={P} setValue={setP} unit="kPa abs"/><Input label="Volumetric flow" value={V} setValue={setV} unit="m³/min"/><Input label="Temperature" value={T} setValue={setT} unit="°C"/></div>
    <ResultBox title="Final Answer">{`T = ${fmt(TK)} K
nDot = PVDot/RT = ${fmt(n)} mol/min = ${fmt(n/60)} mol/s`}</ResultBox>
  </Card>
}

function HumiditySolver() {
  const [P,setP]=useState("101.325"),[ps,setPs]=useState("23.76"),[sr,setSr]=useState("60");
  const sf=toFraction(sr);
  const errors=[invalidNegative("Total pressure",P),invalidNegative("Vapor pressure",ps)].filter(Boolean);
  if(sf.error) errors.push("Relative humidity must be 0–1 or 0%–100%.");
  if(!errors.length && number(ps)>=number(P)) errors.push("Vapor pressure must be less than total pressure.");
  const error=errors[0]||"";
  const Pi=error?NaN:sf.value*number(ps), y=error?NaN:Pi/number(P), H=error?NaN:y/(1-y);
  return <Card><Header title="Raoult / Humidity Solver" text="One condensable component."/>
    <Reference items={["Sr = Pi/Pi* × 100", "Pi = yiP", "Molal humidity = yi/(1−yi)", "Humidity accepts 0–1 or 0%–100%."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Input label="Total P" value={P} setValue={setP} unit="kPa"/><Input label="P*" value={ps} setValue={setPs} unit="kPa"/><Input label="Relative humidity" value={sr} setValue={setSr} unit="0–1 or %"/></div>
    <ResultBox title="Final Answer">{`Pi = ${fmt(Pi)} kPa
yi = ${fmt(y)}
Molal humidity = ${fmt(H)} mol vapor/mol dry gas`}</ResultBox>
  </Card>
}

function AntoineSolver() {
  const [A,setA]=useState("8.07131"),[B,setB]=useState("1730.63"),[C,setC]=useState("233.426"),[T,setT]=useState("25");
  const TK=celsiusToKelvin(T), error=kelvinError("Temperature",TK);
  const p=error?NaN:Math.pow(10,number(A)-number(B)/(number(T)+number(C))), pkPa=p*0.133322;
  return <Card><Header title="Antoine Equation Solver" text="Vapor pressure from Antoine constants."/>
    <Reference items={["log10(P*) = A − B/(T + C)", "Temperature in Kelvin cannot be less than 0.", "Check constants units before trusting the result."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid4"><Input label="A" value={A} setValue={setA}/><Input label="B" value={B} setValue={setB}/><Input label="C" value={C} setValue={setC}/><Input label="T" value={T} setValue={setT} unit="°C"/></div>
    <ResultBox title="Final Answer">{`P* = ${fmt(p)} mmHg = ${fmt(pkPa)} kPa`}</ResultBox>
  </Card>
}

function EnergyBalance() {
  const [m,setM]=useState("2"),[cp,setCp]=useState("4.18"),[tin,setTin]=useState("25"),[tout,setTout]=useState("80"),[mol,setMol]=useState("0"),[dh,setDh]=useState("0");
  const TinK=celsiusToKelvin(tin), ToutK=celsiusToKelvin(tout);
  const errors=[invalidNegative("Mass flowrate",m),invalidNegative("Cp",cp),invalidNegative("Molar flow",mol),kelvinError("Tin",TinK),kelvinError("Tout",ToutK)].filter(Boolean);
  const error=errors[0]||"";
  const sensible=error?NaN:number(m)*number(cp)*(number(tout)-number(tin)), reaction=error?NaN:number(mol)*number(dh), total=sensible+reaction;
  return <Card><Header title="Energy Balance Solver" text="Basic sensible and reaction heat duty."/>
    <Reference items={["Q sensible = mDot Cp ΔT", "Q reaction = nDot ΔHrxn", "Mass/moles cannot be negative.", "Temperature in Kelvin cannot be less than 0."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Input label="mDot" value={m} setValue={setM} unit="kg/s"/><Input label="Cp" value={cp} setValue={setCp} unit="kJ/kg°C"/><Input label="Tin" value={tin} setValue={setTin} unit="°C"/><Input label="Tout" value={tout} setValue={setTout} unit="°C"/><Input label="nDot reaction" value={mol} setValue={setMol} unit="mol/s"/><Input label="ΔHrxn" value={dh} setValue={setDh} unit="kJ/mol"/></div>
    <ResultBox title="Final Answer">{`Q sensible = ${fmt(sensible)} kW
Q reaction = ${fmt(reaction)} kW
Q total = ${fmt(total)} kW`}</ResultBox>
  </Card>
}

function SteamSystem() {
  const [mode,setMode]=useState("wet-steam"),[hf,setHf]=useState("419"),[hg,setHg]=useState("2676"),[x,setX]=useState("0.85"),[m,setM]=useState("4.1667"),[h1,setH1]=useState("2676"),[h2,setH2]=useState("3445"),[ws,setWs]=useState("1500");
  const xf=toFraction(x);
  const errors=[invalidNegative("hf",hf),invalidNegative("hg",hg),invalidNegative("Mass flowrate",m)].filter(Boolean);
  if(xf.error) errors.push("Steam quality must be 0–1 or 0%–100%.");
  const error=errors[0]||"";
  const hWet=error?NaN:number(hf)+xf.value*(number(hg)-number(hf)), Q=error?NaN:number(m)*(number(h2)-number(h1)), turbineQ=error?NaN:number(m)*(number(h2)-number(h1))+number(ws);
  return <Card><Header title="Steam / Enthalpy System" text="Steam-table helper. Enter table enthalpy values manually."/>
    <Reference items={["Wet steam: h = hf + x(hg−hf)", "Heater: Q = mDot(hout−hin)", "Open system: Q − Ws = ΔH", "Built-in full steam tables are a future upgrade."]}/>
    <AlertBox>{error}</AlertBox>
    <div className="grid3"><Select label="Mode" value={mode} setValue={setMode} options={["wet-steam","heater","turbine"]}/><Input label="Mass flowrate" value={m} setValue={setM} unit="kg/s"/><Input label="Quality x" value={x} setValue={setX} unit="0–1 or %"/><Input label="hf" value={hf} setValue={setHf} unit="kJ/kg"/><Input label="hg" value={hg} setValue={setHg} unit="kJ/kg"/><Input label="h in / h1" value={h1} setValue={setH1} unit="kJ/kg"/><Input label="h out / h2" value={h2} setValue={setH2} unit="kJ/kg"/><Input label="Shaft work" value={ws} setValue={setWs} unit="kW"/></div>
    <ResultBox title="Final Answer">{mode==="wet-steam" ? `h = hf + x(hg−hf) = ${fmt(hWet)} kJ/kg` : mode==="heater" ? `Q = mDot(hout−hin) = ${fmt(Q)} kW` : `Q = ΔH + Ws = ${fmt(turbineQ)} kW`}</ResultBox>
  </Card>
}

function RecyclePurge() {
  return <Card><Header title="Recycle / Purge Solver" text="Guided methanol-style purge module."/>
    <Reference items={["This module is intentionally guided, not universal.", "Universal recycle/purge needs equation setup and degrees of freedom.", "Next upgrade: add full stream table input."]}/>
    <ResultBox title="Status">{`Recycle/purge framework is included conceptually.
Next serious upgrade: full stream table + component balance equations.`}</ResultBox>
  </Card>
}

function App() {
  const [tab,setTab]=useState("converter");
  const [dark,setDark]=useState(false);
  const modules=[
    ["converter",RotateCcw,"Unit Converter","Chapter 3 conversions"],
    ["sg",Droplets,"SG & kmol","Density → moles"],
    ["composition",Calculator,"Composition","Mass ↔ mole fraction"],
    ["tank",Factory,"Tank Balance","Accumulation"],
    ["material",GitBranch,"Material Balance","A → C reactor"],
    ["stoich",TestTube2,"Stoichiometry","Limiting/excess"],
    ["gas",Wind,"Ideal Gas","PV = nRT"],
    ["humidity",Droplets,"Raoult/Humidity","Gas-vapor"],
    ["antoine",Calculator,"Antoine","Vapor pressure"],
    ["energy",Flame,"Energy Balance","Q duty"],
    ["steam",Thermometer,"Steam/Enthalpy","Steam helper"],
    ["purge",Factory,"Recycle/Purge","Framework"]
  ];
  return <div className={dark?"app dark":"app"}>
    <main className="layout">
      <section className="hero">
        <div className="hero-left">
          <div className="tag"><Beaker size={16}/> Built specifically for Chemical Engineering BASIC-A</div>
          <div className="brand"><LogoMark dark={dark}/><div><h1>ChemSolver BASIC-A</h1><p>Given → Formula → Substitution → Final Answer</p></div></div>
        </div>
        <button className="toggle" onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>} {dark?"Light":"Dark"}</button>
      </section>
      <section className="content">
        <aside>
          {modules.map(([id,Icon,title,sub])=><SectionButton key={id} active={tab===id} onClick={()=>setTab(id)} icon={Icon} title={title} subtitle={sub}/>)}
          <div className="rules"><b>Validation Rules</b><br/>Mass, moles, pressure, volume, flowrate, SG, Cp cannot be negative. T(K) cannot be less than 0. Fractions accept 0–1 or 0%–100%.</div>
        </aside>
        <section className="panel">
          {tab==="converter"&&<UnitConverter/>}
          {tab==="sg"&&<SGMoles/>}
          {tab==="composition"&&<CompositionSolver/>}
          {tab==="tank"&&<TankBalance/>}
          {tab==="material"&&<MaterialBalance/>}
          {tab==="stoich"&&<StoichSolver/>}
          {tab==="gas"&&<IdealGas/>}
          {tab==="humidity"&&<HumiditySolver/>}
          {tab==="antoine"&&<AntoineSolver/>}
          {tab==="energy"&&<EnergyBalance/>}
          {tab==="steam"&&<SteamSystem/>}
          {tab==="purge"&&<RecyclePurge/>}
        </section>
      </section>
      <footer>ChemSolver BASIC-A © Osama AJ — Educational engineering calculator.</footer>
    </main>
  </div>
}
createRoot(document.getElementById("root")).render(<App />);
