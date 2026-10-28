import PDFDocument from 'pdfkit';

// Page geometry matches the reference reportlab layout (A4, same margins) so the
// two renderers produce visually comparable output.
const MARGIN_LEFT = 36;
const MARGIN_RIGHT = 36;
const MARGIN_TOP = 52;
const MARGIN_BOTTOM = 34;
const LINE_COLOR = '#BBBBBB';
const GREY = '#666666';
const IST_OFFSET_MINUTES = 5 * 60 + 30;
const FOOTER_NOTE =
  'Aatma Edge (BCP) - generated from downtime data. Verify against the main application once it is restored.';
const VITAL_ORDER = [
  'Heart Rate',
  'Respiratory Rate',
  'Temperature',
  'SPO2',
  'Blood Pressure',
  'Heart Rhythms',
  'Respiratory Effort',
  'MEWS Score',
  'Conscious level',
  'Peripheral Temperature',
  'Fall Score',
];

export interface ClinicalSummaryPatient {
  mrn: string;
  patientName: string;
  gender: string | null;
  age: string | null;
  dateOfBirth: string | null;
  admissionDatetime: string | null;
  consultantName: string | null;
  wardName: string | null;
  bedNumber: string | null;
  encounterId: string | null;
  visitNumber: string | null;
  unitName: string | null;
}

// The clinical_summary JSONB payload mirrors the loose, optional-everywhere shape
// produced by the upstream n8n AI-summarization workflow.
export interface ClinicalSummaryJson {
  output?: { progress_notes?: NoteSection; nursing_notes?: NoteSection };
  progress_notes?: NoteSection;
  nursing_notes?: NoteSection;
  allergies?: { allergy: string; severity?: string }[];
  latest_vitals?: Record<string, any>[];
  lab_results?: Record<string, Record<string, string>>;
  abnormal_lab_results?: Record<string, Record<string, string>>;
  intake_output_chart?: { hourly_intake_output?: IoHourRecord[] };
  pending_investigations?: any[];
  active_medications?: Medication[];
}

interface NoteSection {
  summary?: string;
  source?: { recorded_at?: string[]; author?: string };
  diagnosis?: string[];
  background?: string[];
  active_issues?: string[];
  plan?: string[];
  events?: { datetime: string; event: string }[];
}

interface IoHourRecord {
  hour: string;
  intake: { totalMl: number; items: Record<string, number> };
  output: { totalMl: number; items: Record<string, number> };
  balanceMl: number;
}

interface Medication {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  startDate: string;
  endDate: string;
  drugForm?: string;
  mode?: string;
}

export interface BuildClinicalSummaryPdfInput {
  patient: ClinicalSummaryPatient;
  clinicalSummary: ClinicalSummaryJson;
}

interface Column {
  width: number;
  align?: 'left' | 'right';
}

export function buildClinicalSummaryPdf(input: BuildClinicalSummaryPdfInput): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
    bufferPages: true,
    info: {
      Title: `24-hour clinical summary - ${input.patient.patientName} (${input.patient.mrn})`,
      Author: 'Aatma Edge (BCP)',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const contentWidth = doc.page.width - MARGIN_LEFT - MARGIN_RIGHT;
  const data = input.clinicalSummary || {};
  const notes = data.output || data;

  patientBlock(doc, input.patient, contentWidth);
  notesSection(doc, contentWidth, 'Progress Notes', notes.progress_notes, 'progress');
  notesSection(doc, contentWidth, 'Nursing Notes', notes.nursing_notes, 'nursing');
  allergySection(doc, contentWidth, data.allergies);
  vitalsSection(doc, contentWidth, data.latest_vitals || []);
  resultsSections(doc, contentWidth, data);
  ioSection(doc, contentWidth, data.intake_output_chart);
  pendingSection(doc, contentWidth, data.pending_investigations);
  medsSection(doc, contentWidth, data.active_medications);
  generatedFooterBlock(doc, contentWidth);

  addRunningHeadersAndPageNumbers(doc, `${input.patient.patientName} (${input.patient.mrn})`);
  doc.end();
  return done;
}

// ---------- formatting helpers ----------

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Parses the literal date/time fields out of an ISO string without any timezone
// shifting, matching Python's `datetime.fromisoformat(iso)` + `strftime` behaviour.
// The time part is optional: medication start/end dates are date-only strings.
function parseIsoFields(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return { year: 1970, month: 1, day: 1, hour: 0, minute: 0 };
  const [, y, mo, da, h, mi] = m;
  return { year: +y, month: +mo, day: +da, hour: h ? +h : 0, minute: mi ? +mi : 0 };
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const { year, month, day, hour, minute } = parseIsoFields(iso);
  return `${pad(day)}/${pad(month)}/${year} ${pad(hour)}:${pad(minute)}`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const { year, month, day } = parseIsoFields(iso);
  return `${pad(day)}/${pad(month)}/${year}`;
}

// Admission time is sync'd as a UTC instant but displayed in IST, 12-hour clock.
function formatAdmissionIst(iso: string | null | undefined): string {
  if (!iso) return '—';
  const utc = new Date(iso);
  if (Number.isNaN(utc.getTime())) return '—';
  const ist = new Date(utc.getTime() + IST_OFFSET_MINUTES * 60000);
  const hour = ist.getUTCHours();
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${pad(ist.getUTCDate())}/${pad(ist.getUTCMonth() + 1)}/${ist.getUTCFullYear()} ${pad(hour12)}:${pad(ist.getUTCMinutes())} ${meridiem}`;
}

function titleCase(s: string | null | undefined): string {
  return (s || '').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function num(x: number): string {
  const r = Math.round(x * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

function stripSup(s: string): string {
  return s.replace(/<\/?sup>/gi, '');
}

// ---------- low-level layout helpers ----------

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > doc.page.height - MARGIN_BOTTOM) {
    doc.addPage();
  }
}

// Every helper below pins an explicit x (and reports its own y afterwards)
// instead of relying on pdfkit's implicit cursor continuation — mixing that
// with the explicit-coordinate drawing used elsewhere (tables, grids) left
// the cursor drifting rightward and misaligned entire sections.
function heading(doc: PDFKit.PDFDocument, width: number, text: string) {
  const label = text.toUpperCase();
  doc.font('Helvetica-Bold').fontSize(10);
  const h = doc.heightOfString(label, { width });
  ensureSpace(doc, h + 12);
  const y = doc.y + 8;
  doc.fillColor('#000000').text(label, MARGIN_LEFT, y, { width });
  doc.x = MARGIN_LEFT;
  doc.y = y + h + 4;
}

function subheading(doc: PDFKit.PDFDocument, width: number, text: string) {
  doc.font('Helvetica-Bold').fontSize(9);
  const h = doc.heightOfString(text, { width });
  ensureSpace(doc, h + 2);
  const y = doc.y;
  doc.fillColor('#000000').text(text, MARGIN_LEFT, y, { width });
  doc.x = MARGIN_LEFT;
  doc.y = y + h;
}

function note(doc: PDFKit.PDFDocument, width: number, text: string) {
  doc.font('Helvetica-Oblique').fontSize(8.5);
  const h = doc.heightOfString(text, { width });
  ensureSpace(doc, h + 4);
  const y = doc.y;
  doc.fillColor(GREY).text(text, MARGIN_LEFT, y, { width });
  doc.fillColor('#000000');
  doc.x = MARGIN_LEFT;
  doc.y = y + h + 2;
}

function paragraph(doc: PDFKit.PDFDocument, width: number, text: string) {
  doc.font('Helvetica').fontSize(9);
  const h = doc.heightOfString(text, { width });
  ensureSpace(doc, h + 2);
  const y = doc.y;
  doc.text(text, MARGIN_LEFT, y, { width });
  doc.x = MARGIN_LEFT;
  doc.y = y + h + 2;
}

function bullet(doc: PDFKit.PDFDocument, width: number, text: string) {
  const indent = 15;
  doc.font('Helvetica').fontSize(9);
  const h = doc.heightOfString(text, { width: width - indent });
  ensureSpace(doc, h + 2);
  const y = doc.y;
  doc.text('•', MARGIN_LEFT, y, { width: indent });
  doc.text(text, MARGIN_LEFT + indent, y, { width: width - indent });
  doc.x = MARGIN_LEFT;
  doc.y = y + h + 2;
}

function keyValueGrid(
  doc: PDFKit.PDFDocument,
  widths: number[],
  rows: [string, string, string, string][],
) {
  const fontSize = 9;
  rows.forEach(([lk, lv, rk, rv]) => {
    const h =
      Math.max(
        doc.font('Helvetica-Bold').fontSize(fontSize).heightOfString(lk, { width: widths[0] }),
        doc.font('Helvetica').fontSize(fontSize).heightOfString(lv, { width: widths[1] }),
        doc.font('Helvetica-Bold').fontSize(fontSize).heightOfString(rk, { width: widths[2] }),
        doc.font('Helvetica').fontSize(fontSize).heightOfString(rv, { width: widths[3] }),
      ) + 2;
    ensureSpace(doc, h);
    const y = doc.y;
    let x = MARGIN_LEFT;
    doc.font('Helvetica-Bold').fontSize(fontSize).text(lk, x, y, { width: widths[0] });
    x += widths[0];
    doc.font('Helvetica').fontSize(fontSize).text(`: ${lv}`, x, y, { width: widths[1] });
    x += widths[1];
    doc.font('Helvetica-Bold').fontSize(fontSize).text(rk, x, y, { width: widths[2] });
    x += widths[2];
    doc.font('Helvetica').fontSize(fontSize).text(`: ${rv}`, x, y, { width: widths[3] });
    doc.y = y + h;
  });
  doc.x = MARGIN_LEFT;
}

function rowHeight(
  doc: PDFKit.PDFDocument,
  cells: string[],
  columns: Column[],
  font: string,
  fontSize: number,
): number {
  let max = 0;
  cells.forEach((text, i) => {
    const h = doc.font(font).fontSize(fontSize).heightOfString(text || '', { width: columns[i].width - 6 });
    max = Math.max(max, h);
  });
  return max + 6;
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  cells: string[],
  columns: Column[],
  font: string,
  fontSize: number,
) {
  let x = MARGIN_LEFT;
  doc.font(font).fontSize(fontSize).fillColor('#000000');
  cells.forEach((text, i) => {
    doc.text(text || '', x + 3, y + 2, { width: columns[i].width - 6, align: columns[i].align ?? 'left' });
    x += columns[i].width;
  });
}

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: Column[],
  header: string[],
  rows: string[][],
  opts: { repeatHeader?: boolean } = {},
) {
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);

  const drawHeaderRow = () => {
    const h = rowHeight(doc, header, columns, 'Helvetica-Bold', 8);
    ensureSpace(doc, h + 2);
    const y = doc.y;
    doc
      .moveTo(MARGIN_LEFT, y)
      .lineTo(MARGIN_LEFT + totalWidth, y)
      .lineWidth(0.8)
      .strokeColor('#000000')
      .stroke();
    drawTableRow(doc, y, header, columns, 'Helvetica-Bold', 8);
    doc
      .moveTo(MARGIN_LEFT, y + h)
      .lineTo(MARGIN_LEFT + totalWidth, y + h)
      .lineWidth(0.8)
      .strokeColor('#000000')
      .stroke();
    doc.y = y + h;
  };

  drawHeaderRow();
  rows.forEach((row) => {
    const h = rowHeight(doc, row, columns, 'Helvetica', 8);
    if (doc.y + h > doc.page.height - MARGIN_BOTTOM) {
      doc.addPage();
      if (opts.repeatHeader) drawHeaderRow();
    }
    const y = doc.y;
    drawTableRow(doc, y, row, columns, 'Helvetica', 8);
    doc
      .moveTo(MARGIN_LEFT, y + h)
      .lineTo(MARGIN_LEFT + totalWidth, y + h)
      .lineWidth(0.4)
      .strokeColor(LINE_COLOR)
      .stroke();
    doc.y = y + h;
  });
  doc.moveDown(0.3);
}

// ---------- sections ----------

function patientBlock(doc: PDFKit.PDFDocument, p: ClinicalSummaryPatient, contentWidth: number) {
  doc.font('Helvetica-Bold').fontSize(13).text('CLINICAL SUMMARY - LAST 24 HOURS', MARGIN_LEFT, doc.y, { width: contentWidth });
  doc.x = MARGIN_LEFT;
  doc.moveDown(0.3);
  doc
    .moveTo(MARGIN_LEFT, doc.y)
    .lineTo(MARGIN_LEFT + contentWidth, doc.y)
    .lineWidth(0.8)
    .strokeColor('#000000')
    .stroke();
  doc.moveDown(0.5);

  const widths = [88, 160, 78, contentWidth - 326];
  const genderAge = [p.gender ? titleCase(p.gender) : '—', p.age ? `${p.age} Years` : '', p.dateOfBirth ? `(${formatDate(p.dateOfBirth)})` : '']
    .filter(Boolean)
    .join(' ');

  keyValueGrid(doc, widths, [
    ['Patient Name', p.patientName || '—', 'Patient MRN', p.mrn || '—'],
    ['Gender/Age', genderAge || '—', 'Admission Date', formatAdmissionIst(p.admissionDatetime)],
    ['Primary Consultant', p.consultantName || '—', 'Location', `${p.wardName || '—'} - ${p.bedNumber || '—'}`],
    ['Encounter / Visit', `${p.encounterId || '—'} / ${p.visitNumber || '—'}`, 'Unit', p.unitName || '—'],
  ]);

  doc.moveDown(0.4);
  doc
    .moveTo(MARGIN_LEFT, doc.y)
    .lineTo(MARGIN_LEFT + contentWidth, doc.y)
    .lineWidth(0.8)
    .strokeColor('#000000')
    .stroke();
  doc.moveDown(0.3);
}

const LIST_KEYS: [keyof NoteSection, string][] = [
  ['diagnosis', 'Diagnosis'],
  ['background', 'Background'],
  ['active_issues', 'Active issues'],
  ['plan', 'Plan'],
];

function notesSection(
  doc: PDFKit.PDFDocument,
  width: number,
  title: string,
  sec: NoteSection | undefined,
  kind: string,
) {
  heading(doc, width, title);
  if (!sec || !sec.summary) {
    bullet(doc, width, `No ${kind} note in this period`);
    return;
  }
  const src = sec.source || {};
  const recorded = (src.recorded_at || []).map((x) => formatDateTime(x)).join(', ');
  let meta = recorded ? `Recorded ${recorded}` : 'Recorded time not available';
  if (src.author) meta += ` · ${src.author}`;
  note(doc, width, `${meta} · AI-generated summary of the note`);
  paragraph(doc, width, sec.summary);

  for (const [key, label] of LIST_KEYS) {
    const list = sec[key] as string[] | undefined;
    if (list && list.length) {
      subheading(doc, width, label);
      list.forEach((item) => bullet(doc, width, item));
    }
  }
  if (sec.events && sec.events.length) {
    subheading(doc, width, 'Events');
    sec.events.forEach((e) => bullet(doc, width, `${e.datetime} - ${e.event}`));
  }
}

function allergySection(doc: PDFKit.PDFDocument, width: number, allergies: ClinicalSummaryJson['allergies']) {
  heading(doc, width, 'Allergy');
  if (!allergies || allergies.length === 0) {
    bullet(doc, width, 'No allergy information recorded');
    return;
  }
  allergies.forEach((a) => bullet(doc, width, a.allergy + (a.severity ? ` : ${a.severity}` : '')));
}

function vitalsSection(doc: PDFKit.PDFDocument, width: number, vitals: Record<string, any>[]) {
  heading(doc, width, 'Latest Vitals');
  const sorted = [...vitals].sort((a, b) => (b.recordedAt || '').localeCompare(a.recordedAt || ''));
  sorted.forEach((rec) => {
    subheading(doc, width, `Recorded ${formatDateTime(rec.recordedAt)}`);
    doc.moveDown(0.1);
    const keys = Object.keys(rec)
      .filter((k) => k !== 'recordedAt')
      .sort((a, b) => {
        const ia = VITAL_ORDER.indexOf(a);
        const ib = VITAL_ORDER.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    const colWidth = width / 3;
    for (let i = 0; i < keys.length; i += 3) {
      const rowKeys = keys.slice(i, i + 3);
      const texts = rowKeys.map((k) => `${k}: ${rec[k]}`);
      const h = Math.max(...texts.map((t) => doc.font('Helvetica').fontSize(9).heightOfString(t, { width: colWidth - 6 }))) + 3;
      ensureSpace(doc, h);
      const y = doc.y;
      texts.forEach((t, j) => doc.font('Helvetica').fontSize(9).text(t, MARGIN_LEFT + j * colWidth, y, { width: colWidth - 6 }));
      doc.y = y + h;
    }
    doc.moveDown(0.2);
  });
}

function labTables(doc: PDFKit.PDFDocument, width: number, labs: Record<string, Record<string, string>>) {
  const columns: Column[] = [
    { width: width * 0.32 },
    { width: width * 0.18 },
    { width: width * 0.32 },
    { width: width * 0.18 },
  ];
  Object.keys(labs)
    .sort((a, b) => b.localeCompare(a))
    .forEach((ts) => {
      subheading(doc, width, `Collected ${formatDateTime(ts)}`);
      doc.moveDown(0.1);
      const items = Object.entries(labs[ts]);
      const half = Math.ceil(items.length / 2);
      const left = items.slice(0, half);
      const right = items.slice(half);
      while (right.length < left.length) right.push(['', '']);
      const rows = left.map(([a, b], i) => {
        const [c, e] = right[i] ?? ['', ''];
        return [stripSup(a), stripSup(b), stripSup(c), stripSup(e)];
      });
      drawTable(doc, columns, ['Test', 'Result', 'Test', 'Result'], rows);
    });
}

function resultsSections(doc: PDFKit.PDFDocument, width: number, data: ClinicalSummaryJson) {
  if (data.lab_results && Object.keys(data.lab_results).length) {
    heading(doc, width, 'Investigation Results');
    labTables(doc, width, data.lab_results);
  }
  heading(doc, width, 'Abnormal Results');
  const abnormal = data.abnormal_lab_results || {};
  if (Object.keys(abnormal).length) {
    labTables(doc, width, abnormal);
  } else {
    bullet(doc, width, 'No abnormal results in the last 24 hours');
  }
}

function ioSection(doc: PDFKit.PDFDocument, width: number, chart: ClinicalSummaryJson['intake_output_chart']) {
  heading(doc, width, 'Intake / Output (hourly)');
  const io = chart?.hourly_intake_output || [];
  if (!io.length) {
    bullet(doc, width, 'No intake/output recorded');
    return;
  }
  const totalIn = io.reduce((s, r) => s + r.intake.totalMl, 0);
  const totalOut = io.reduce((s, r) => s + r.output.totalMl, 0);
  const net = totalIn - totalOut;
  note(doc, width, `Covers ${formatDateTime(io[0].hour)} to ${formatDateTime(io[io.length - 1].hour)}. Values in mL.`);
  doc.moveDown(0.1);

  const detail = (items: Record<string, number>) =>
    Object.entries(items)
      .map(([k, v]) => `${k} ${num(v)}`)
      .join(', ');

  const columns: Column[] = [
    { width: 52 },
    { width: 170 },
    { width: 36, align: 'right' },
    { width: 170 },
    { width: 36, align: 'right' },
    { width: width - 464, align: 'right' },
  ];
  const header = ['Hour', 'Intake detail', 'In', 'Output detail', 'Out', 'Balance'];
  const rows = io.map((r) => [
    formatDateTime(r.hour).replace(/\d{4} /, ''),
    detail(r.intake.items),
    num(r.intake.totalMl),
    detail(r.output.items),
    num(r.output.totalMl),
    (r.balanceMl > 0 ? '+' : '') + num(r.balanceMl),
  ]);
  rows.push(['Total', '', num(totalIn), '', num(totalOut), (net > 0 ? '+' : '') + num(net)]);

  drawTable(doc, columns, header, rows, { repeatHeader: true });
}

function pendingSection(doc: PDFKit.PDFDocument, width: number, pend: any[] | undefined) {
  heading(doc, width, 'Pending Investigations');
  if (!pend || pend.length === 0) {
    bullet(doc, width, 'No pending investigations');
    return;
  }
  pend.forEach((x) => {
    if (typeof x === 'string') {
      bullet(doc, width, x);
    } else {
      bullet(doc, width, Object.values(x).filter(Boolean).join(' - '));
    }
  });
}

function medsSection(doc: PDFKit.PDFDocument, width: number, meds: Medication[] | undefined) {
  heading(doc, width, 'Active Medications');
  if (!meds || meds.length === 0) {
    bullet(doc, width, 'No active medications');
    return;
  }
  const columns: Column[] = [
    { width: 140 },
    { width: 76 },
    { width: 124 },
    { width: 80 },
    { width: 51 },
    { width: width - 471 },
  ];
  const rows = meds.map((m) => {
    const parts = m.name.replace(/^-+|-+$/g, '').split('-');
    const generic = titleCase(parts[0]);
    const brand = parts.length > 3 && parts[3].trim() ? titleCase(parts[3]) : '';
    let sub = titleCase(m.drugForm || '') + (brand ? `, ${brand}` : '');
    if (m.mode && m.mode.toLowerCase() !== 'routine') sub += ` [${m.mode}]`;
    let route = (m.route || '').replace('NASOGRATRIC', 'NASOGASTRIC');
    route = route === route.toUpperCase() ? titleCase(route) : route;
    return [`${generic} (${sub})`, m.dose, route, m.frequency, formatDate(m.startDate), formatDate(m.endDate)];
  });
  drawTable(doc, columns, ['Medication', 'Dose', 'Route', 'Frequency', 'Start', 'End'], rows, { repeatHeader: true });
}

function generatedFooterBlock(doc: PDFKit.PDFDocument, width: number) {
  doc.moveDown(0.5);
  ensureSpace(doc, 20);
  doc
    .moveTo(MARGIN_LEFT, doc.y)
    .lineTo(MARGIN_LEFT + width, doc.y)
    .lineWidth(0.4)
    .strokeColor(LINE_COLOR)
    .stroke();
  doc.moveDown(0.2);
  const now = new Date(Date.now() + IST_OFFSET_MINUTES * 60000);
  const hour = now.getUTCHours();
  const meridiem = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const generatedOn = `${pad(now.getUTCDate())}/${pad(now.getUTCMonth() + 1)}/${now.getUTCFullYear()} ${pad(hour12)}:${pad(now.getUTCMinutes())} ${meridiem}`;
  keyValueGrid(doc, [78, 170, 78, width - 326], [['Generated By', 'Aatma Edge (BCP)', 'Generated On', generatedOn]]);
}

// Reproduces the reference PDF's running header (patient name on pages 2+) and
// "Page X of N" footer, which can only be drawn once the total page count is known.
function addRunningHeadersAndPageNumbers(doc: PDFKit.PDFDocument, patientLine: string) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = range.start; i < range.start + total; i++) {
    doc.switchToPage(i);
    const { width: pageWidth, height: pageHeight } = doc.page;

    // Drawing this close to the bottom edge can otherwise trip pdfkit's
    // automatic pagination and silently inject extra blank pages.
    const originalBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    if (i > range.start) {
      // Reportlab draws in a bottom-up coordinate system, so its "H - 40"/"H - 48"
      // sit near the TOP of the page; pdfkit's y grows downward from the top,
      // so the equivalent position here is a small y, not pageHeight-minus-something
      // (that previously put this line at the bottom, on top of the footer).
      doc.font('Helvetica').fontSize(10).fillColor('#000000').text(patientLine, MARGIN_LEFT, 32, {
        width: pageWidth - MARGIN_LEFT - MARGIN_RIGHT,
        lineBreak: false,
      });
      doc
        .moveTo(MARGIN_LEFT, 48)
        .lineTo(pageWidth - MARGIN_RIGHT, 48)
        .lineWidth(0.8)
        .strokeColor('#000000')
        .stroke();
    }

    doc.font('Helvetica').fontSize(8).fillColor(GREY);
    doc.text(FOOTER_NOTE, MARGIN_LEFT, pageHeight - 22, {
      width: pageWidth - MARGIN_LEFT - MARGIN_RIGHT - 130,
      lineBreak: false,
      ellipsis: true,
    });
    doc.text(`Page ${i - range.start + 1} of ${total}`, pageWidth - MARGIN_RIGHT - 120, pageHeight - 22, {
      width: 120,
      align: 'right',
      lineBreak: false,
    });

    doc.page.margins.bottom = originalBottomMargin;
    doc.x = MARGIN_LEFT;
  }
}
