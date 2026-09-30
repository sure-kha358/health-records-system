/* =========================================================
   HEALTH RECORD SYSTEM
   HEALTHCARE PROVIDER / DOCTOR DASHBOARD
   ========================================================= */

const USERS_KEY = "hrs_users";
const CURRENT_USER_KEY = "hrs_current_user";

let currentProvider = null;
let selectedPatient = null;


/* =========================================================
   STORAGE
   ========================================================= */

function getUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem(USERS_KEY)
        );

        return Array.isArray(users) ? users : [];

    } catch (error) {
        return [];
    }
}


function saveUsers(users) {
    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem(CURRENT_USER_KEY)
        );
    } catch (error) {
        return null;
    }
}


function updatePatientInStorage(patient) {

    const users = getUsers();

    const index = users.findIndex(
        user => user.id === patient.id
    );

    if (index === -1) {
        return false;
    }

    users[index] = patient;

    saveUsers(users);

    return true;
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitials(name) {

    if (!name) {
        return "DR";
    }

    const words = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


function formatDate(value) {

    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function getToday() {

    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatFileSize(bytes) {

    if (!bytes) {
        return "";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes / (1024 * 1024)
    ).toFixed(2)} MB`;
}


/* =========================================================
   PATIENT ARRAY INITIALIZATION
   ========================================================= */

function initializePatientArrays(patient) {

    if (!Array.isArray(patient.records)) {
        patient.records = [];
    }

    if (!Array.isArray(patient.reports)) {
        patient.reports = [];
    }

    if (!Array.isArray(patient.prescriptions)) {
        patient.prescriptions = [];
    }

    return patient;
}


/* =========================================================
   TOAST
   ========================================================= */

function showProviderToast(message) {

    const toast =
        document.getElementById(
            "providerToast"
        );

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(
        window.providerToastTimer
    );

    window.providerToastTimer =
        setTimeout(() => {

            toast.style.display = "none";

        }, 2800);
}


/* =========================================================
   PROVIDER PROTECTION
   ========================================================= */

function protectProviderPage() {

    const user = getCurrentUser();

    if (
        !user ||
        user.role !== "provider"
    ) {

        window.location.href =
            "index.html";

        return false;
    }

    currentProvider = user;

    return true;
}


/* =========================================================
   GET PATIENTS
   ========================================================= */

function getPatients() {

    return getUsers().filter(
        user =>
            user.role === "patient"
    );
}


/* =========================================================
   PROVIDER STATISTICS
   ========================================================= */

function updateProviderStats() {

    const patients = getPatients();

    let records = 0;
    let reports = 0;
    let prescriptions = 0;

    patients.forEach(patient => {

        records += Array.isArray(
            patient.records
        )
            ? patient.records.length
            : 0;

        reports += Array.isArray(
            patient.reports
        )
            ? patient.reports.length
            : 0;

        prescriptions += Array.isArray(
            patient.prescriptions
        )
            ? patient.prescriptions.length
            : 0;

    });


    const patientCount =
        document.getElementById(
            "providerPatientCount"
        );

    const recordCount =
        document.getElementById(
            "providerRecordCount"
        );

    const reportCount =
        document.getElementById(
            "providerReportCount"
        );

    const prescriptionCount =
        document.getElementById(
            "providerPrescriptionCount"
        );


    if (patientCount) {
        patientCount.textContent =
            patients.length;
    }

    if (recordCount) {
        recordCount.textContent =
            records;
    }

    if (reportCount) {
        reportCount.textContent =
            reports;
    }

    if (prescriptionCount) {
        prescriptionCount.textContent =
            prescriptions;
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showProviderSection(sectionName) {

    const sections =
        document.querySelectorAll(
            ".provider-section"
        );

    sections.forEach(section => {
        section.style.display = "none";
    });


    const section =
        document.getElementById(
            `provider-${sectionName}`
        );

    if (section) {
        section.style.display = "block";
    }


    const navItems =
        document.querySelectorAll(
            ".nav-item[data-provider-section]"
        );

    navItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.dataset.providerSection ===
            sectionName
        ) {

            item.classList.add("active");
        }

    });


    if (sectionName === "patients") {
        renderAllPatients();
    }

    if (sectionName === "records") {
        renderSelectedPatientRecords();
    }

    if (sectionName === "reports") {
        renderSelectedPatientReports();
    }

    if (sectionName === "prescriptions") {
        renderSelectedPatientPrescriptions();
    }
}


/* =========================================================
   SEARCH PATIENT
   ========================================================= */

function searchPatients(searchTerm) {

    const patients = getPatients();

    const term = String(
        searchTerm || ""
    )
        .trim()
        .toLowerCase();


    if (!term) {
        return patients;
    }


    return patients.filter(patient => {

        const name =
            String(
                patient.name || ""
            ).toLowerCase();

        const phone =
            String(
                patient.phone || ""
            ).toLowerCase();

        const email =
            String(
                patient.email || ""
            ).toLowerCase();


        return (
            name.includes(term) ||
            phone.includes(term) ||
            email.includes(term)
        );
    });
}


/* =========================================================
   PATIENT CARD
   ========================================================= */

function createPatientCard(patient) {

    const recordCount =
        Array.isArray(patient.records)
            ? patient.records.length
            : 0;

    const reportCount =
        Array.isArray(patient.reports)
            ? patient.reports.length
            : 0;


    return `

        <div
            class="patient-result-card"
            style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                padding:18px;
                margin-bottom:12px;
                border:1px solid #e0edf2;
                border-radius:16px;
                background:#ffffff;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                    min-width:0;
                "
            >

                <div
                    style="
                        width:48px;
                        height:48px;
                        border-radius:14px;
                        background:#eaf7fc;
                        color:#16779d;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-weight:800;
                        flex-shrink:0;
                    "
                >
                    ${getInitials(
                        patient.name
                    )}
                </div>


                <div style="min-width:0;">

                    <h3
                        style="
                            margin:0 0 5px;
                            font-size:14px;
                            color:#163b4d;
                        "
                    >
                        ${escapeHTML(
                            patient.name
                        )}
                    </h3>

                    <p
                        style="
                            margin:0 0 4px;
                            color:#718b98;
                            font-size:10px;
                        "
                    >
                        📞
                        ${escapeHTML(
                            patient.phone ||
                            "No phone"
                        )}
                    </p>

                    <p
                        style="
                            margin:0;
                            color:#718b98;
                            font-size:10px;
                        "
                    >
                        ✉
                        ${escapeHTML(
                            patient.email ||
                            "No email"
                        )}
                    </p>

                </div>

            </div>


            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    flex-wrap:wrap;
                    justify-content:flex-end;
                "
            >

                <span
                    style="
                        padding:7px 10px;
                        border-radius:20px;
                        background:#f2f8fa;
                        color:#557482;
                        font-size:9px;
                    "
                >
                    ${recordCount} Records
                </span>

                <span
                    style="
                        padding:7px 10px;
                        border-radius:20px;
                        background:#f2f8fa;
                        color:#557482;
                        font-size:9px;
                    "
                >
                    ${reportCount} Reports
                </span>

                <button
                    class="btn-primary provider-select-patient"
                    data-patient-id="${escapeHTML(
                        patient.id
                    )}"
                    type="button"
                >
                    View Patient
                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   RENDER PATIENT SEARCH RESULTS
   ========================================================= */

function renderPatientSearchResults(
    containerId,
    searchTerm
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) {
        return;
    }


    const patients =
        searchPatients(searchTerm);


    if (!patients.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🔍
                </div>

                <h3>
                    No patient found
                </h3>

                <p>
                    Try another name,
                    phone number or email.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        patients
            .map(createPatientCard)
            .join("");
}


/* =========================================================
   RENDER ALL PATIENTS
   ========================================================= */

function renderAllPatients() {

    const input =
        document.getElementById(
            "patientSearchInput"
        );

    const term =
        input
            ? input.value
            : "";

    renderPatientSearchResults(
        "patientSearchResults",
        term
    );
}


/* =========================================================
   SELECT PATIENT
   ========================================================= */

function selectPatient(patientId) {

    const patient =
        getPatients().find(
            user =>
                user.id === patientId
        );


    if (!patient) {

        showProviderToast(
            "Patient not found."
        );

        return;
    }


    selectedPatient =
        initializePatientArrays(
            patient
        );


    showProviderToast(
        `${selectedPatient.name} selected.`
    );


    showProviderSection(
        "records"
    );
}


/* =========================================================
   RECORD ICON
   ========================================================= */

function getRecordIcon(type) {

    const icons = {

        "General Checkup": "🩺",
        "Cardiology": "❤️",
        "Blood Test": "🩸",
        "ECG": "💓",
        "X-Ray": "🦴",
        "MRI": "🧠",
        "CT Scan": "🔬",
        "Respiratory": "🫁",
        "Orthopedic": "🦴",
        "Neurology": "🧠",
        "Dental": "🦷",
        "Eye": "👁️",
        "Prescription": "💊",
        "Lab Report": "🧪",
        "Other": "📋"

    };

    return icons[type] || "📋";
}


/* =========================================================
   SELECTED PATIENT HEADER
   ========================================================= */

function createSelectedPatientHeader() {

    if (!selectedPatient) {

        return `

            <div class="empty-state">

                <div class="empty-state-icon">
                    👤
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Search and select a patient
                    to continue.
                </p>

            </div>

        `;
    }


    return `

        <div
            style="
                padding:20px;
                border-radius:18px;
                background:#f4fbfd;
                border:1px solid #dceef3;
                margin-bottom:20px;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    flex-wrap:wrap;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:14px;
                    "
                >

                    <div
                        style="
                            width:58px;
                            height:58px;
                            border-radius:18px;
                            background:#dff3fa;
                            color:#15759b;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:16px;
                            font-weight:800;
                        "
                    >
                        ${getInitials(
                            selectedPatient.name
                        )}
                    </div>


                    <div>

                        <h2
                            style="
                                margin:0 0 5px;
                                color:#173d50;
                            "
                        >
                            ${escapeHTML(
                                selectedPatient.name
                            )}
                        </h2>

                        <p
                            style="
                                margin:0;
                                color:#728d99;
                                font-size:10px;
                            "
                        >
                            ${escapeHTML(
                                selectedPatient.phone ||
                                "No phone"
                            )}

                            ${
                                selectedPatient.email
                                    ? `
                                        •
                                        ${escapeHTML(
                                            selectedPatient.email
                                        )}
                                      `
                                    : ""
                            }

                        </p>

                    </div>

                </div>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        class="btn-secondary"
                        id="providerPatientProfileBtn"
                        type="button"
                    >
                        👤 Profile
                    </button>


                    <button
                        class="btn-primary"
                        id="providerAddRecordBtn"
                        type="button"
                    >
                        + Add Record
                    </button>


                    <button
                        class="btn-primary"
                        id="providerAddPrescriptionBtn"
                        type="button"
                    >
                        + Prescription
                    </button>

                </div>

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(4,minmax(0,1fr));
                    gap:10px;
                    margin-top:18px;
                "
            >

                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${selectedPatient.records.length}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Records
                    </small>

                </div>


                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${selectedPatient.reports.length}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Reports
                    </small>

                </div>


                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${selectedPatient.prescriptions.length}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Prescriptions
                    </small>

                </div>


                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${escapeHTML(
                            selectedPatient.gender ||
                            "—"
                        )}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Gender
                    </small>

                </div>

            </div>

        </div>

    `;
}


/* =========================================================
   RECORD CARD
   ========================================================= */

function createRecordCard(record) {

    return `

        <div
            style="
                border:1px solid #e2edf1;
                border-radius:16px;
                padding:18px;
                margin-bottom:12px;
                background:#fff;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <div
                    style="
                        display:flex;
                        gap:13px;
                    "
                >

                    <div
                        style="
                            width:46px;
                            height:46px;
                            border-radius:14px;
                            background:#eef9fc;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:20px;
                            flex-shrink:0;
                        "
                    >
                        ${getRecordIcon(
                            record.type
                        )}
                    </div>


                    <div>

                        <h3
                            style="
                                margin:0 0 5px;
                                color:#193f51;
                                font-size:13px;
                            "
                        >
                            ${escapeHTML(
                                record.type ||
                                "Medical Record"
                            )}
                        </h3>


                        <p
                            style="
                                margin:0;
                                color:#7b929d;
                                font-size:9px;
                            "
                        >
                            ${formatDate(
                                record.date
                            )}

                            ${
                                record.doctor
                                    ? `
                                        •
                                        ${escapeHTML(
                                            record.doctor
                                        )}
                                      `
                                    : ""
                            }

                        </p>


                        ${
                            record.hospital
                                ? `
                                    <p
                                        style="
                                            margin:4px 0 0;
                                            color:#7b929d;
                                            font-size:9px;
                                        "
                                    >
                                        🏥
                                        ${escapeHTML(
                                            record.hospital
                                        )}
                                    </p>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <span
                    style="
                        padding:6px 9px;
                        border-radius:20px;
                        background:#edf8f1;
                        color:#328158;
                        font-size:8px;
                        font-weight:700;
                        height:max-content;
                    "
                >
                    ${
                        record.source === "provider"
                            ? "Provider Added"
                            : "Patient Added"
                    }
                </span>

            </div>


            ${
                record.notes
                    ? `
                        <div
                            style="
                                margin-top:15px;
                                padding:12px;
                                border-radius:10px;
                                background:#f8fbfc;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#496673;
                                    font-size:9px;
                                    margin-bottom:5px;
                                "
                            >
                                Medical Notes
                            </strong>

                            <p
                                style="
                                    margin:0;
                                    color:#617b87;
                                    font-size:10px;
                                    line-height:1.6;
                                "
                            >
                                ${escapeHTML(
                                    record.notes
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                record.conclusion
                    ? `
                        <div
                            style="
                                margin-top:10px;
                                padding:12px;
                                border-radius:10px;
                                background:#f8fbfc;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#496673;
                                    font-size:9px;
                                    margin-bottom:5px;
                                "
                            >
                                Conclusion / Findings
                            </strong>

                            <p
                                style="
                                    margin:0;
                                    color:#617b87;
                                    font-size:10px;
                                    line-height:1.6;
                                "
                            >
                                ${escapeHTML(
                                    record.conclusion
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                record.file
                    ? `
                        <div
                            style="
                                margin-top:12px;
                            "
                        >

                            <button
                                type="button"
                                class="provider-file-btn"
                                data-record-file-id="${escapeHTML(
                                    record.id
                                )}"
                                style="
                                    border:0;
                                    cursor:pointer;
                                    padding:8px 11px;
                                    border-radius:9px;
                                    background:#edf8fb;
                                    color:#167493;
                                    font-size:9px;
                                    font-weight:700;
                                "
                            >
                                📎
                                ${escapeHTML(
                                    record.file.name
                                )}
                            </button>

                            <small
                                style="
                                    color:#91a5ae;
                                    font-size:8px;
                                    margin-left:6px;
                                "
                            >
                                ${formatFileSize(
                                    record.file.size
                                )}
                            </small>

                        </div>
                      `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   RENDER MEDICAL RECORDS
   ========================================================= */

function renderSelectedPatientRecords() {

    const container =
        document.getElementById(
            "selectedPatientRecordArea"
        );

    if (!container) {
        return;
    }


    if (!selectedPatient) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📋
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Search and select a patient
                    to view medical records.
                </p>

                <button
                    class="btn-primary"
                    id="recordsFindPatientBtn"
                    type="button"
                >
                    🔍 Find Patient
                </button>

            </div>

        `;

        return;
    }


    const records =
        [...selectedPatient.records]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt
                    ) -
                    new Date(
                        a.date ||
                        a.createdAt
                    )
            );


    container.innerHTML =

        createSelectedPatientHeader() +

        `

            <h3
                style="
                    margin:0 0 15px;
                    color:#183e50;
                "
            >
                Medical History
            </h3>


            ${
                records.length
                    ? records
                        .map(
                            createRecordCard
                        )
                        .join("")
                    : `
                        <div class="empty-state">

                            <div class="empty-state-icon">
                                📋
                            </div>

                            <h3>
                                No medical records yet
                            </h3>

                            <p>
                                Add the patient's
                                first medical record.
                            </p>

                            <button
                                class="btn-primary"
                                id="providerEmptyAddRecordBtn"
                                type="button"
                            >
                                + Add Medical Record
                            </button>

                        </div>
                      `
            }

        `;
}


/* =========================================================
   REPORT CARD
   ========================================================= */

function createReportCard(report) {

    return `

        <div
            style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                padding:16px;
                margin-bottom:12px;
                border:1px solid #e2edf1;
                border-radius:15px;
                background:#fff;
            "
        >

            <div
                style="
                    display:flex;
                    gap:12px;
                    align-items:center;
                "
            >

                <div
                    style="
                        width:45px;
                        height:45px;
                        border-radius:13px;
                        background:#edf8fc;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:19px;
                    "
                >
                    📄
                </div>


                <div>

                    <h3
                        style="
                            margin:0 0 5px;
                            color:#1a4052;
                            font-size:12px;
                        "
                    >
                        ${escapeHTML(
                            report.name ||
                            report.type ||
                            "Medical Report"
                        )}
                    </h3>


                    <p
                        style="
                            margin:0;
                            color:#8298a2;
                            font-size:9px;
                        "
                    >
                        ${formatDate(
                            report.date
                        )}

                        ${
                            report.type
                                ? `
                                    •
                                    ${escapeHTML(
                                        report.type
                                    )}
                                  `
                                : ""
                        }

                    </p>


                    ${
                        report.conclusion
                            ? `
                                <p
                                    style="
                                        margin:6px 0 0;
                                        color:#617985;
                                        font-size:9px;
                                    "
                                >
                                    ${escapeHTML(
                                        report.conclusion
                                    )}
                                </p>
                              `
                            : ""
                    }

                </div>

            </div>


            ${
                report.file
                    ? `
                        <button
                            class="btn-secondary provider-report-file-btn"
                            data-report-id="${escapeHTML(
                                report.id
                            )}"
                            type="button"
                        >
                            📎 View
                        </button>
                      `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   RENDER REPORTS
   ========================================================= */

function renderSelectedPatientReports() {

    const container =
        document.getElementById(
            "providerReportsArea"
        );

    if (!container) {
        return;
    }


    if (!selectedPatient) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📄
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Select a patient to view reports.
                </p>

            </div>

        `;

        return;
    }


    const reports =
        [...selectedPatient.reports]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt
                    ) -
                    new Date(
                        a.date ||
                        a.createdAt
                    )
            );


    container.innerHTML =

        createSelectedPatientHeader() +

        `

            <h3
                style="
                    margin:0 0 15px;
                    color:#183e50;
                "
            >
                Patient Reports
            </h3>


            <p
                style="
                    color:#8398a1;
                    font-size:9px;
                    margin-top:-8px;
                    margin-bottom:15px;
                "
            >
                ECG, X-Ray, MRI, CT,
                blood reports and other
                medical documents.
            </p>


            ${
                reports.length
                    ? reports
                        .map(
                            createReportCard
                        )
                        .join("")
                    : `
                        <div class="empty-state">

                            <div class="empty-state-icon">
                                📄
                            </div>

                            <h3>
                                No reports available
                            </h3>

                            <p>
                                This patient has not
                                uploaded any reports yet.
                            </p>

                        </div>
                      `
            }

        `;
}


/* =========================================================
   PRESCRIPTION CARD
   ========================================================= */

function createPrescriptionCard(
    prescription
) {

    return `

        <div
            style="
                padding:17px;
                border:1px solid #e2edf1;
                border-radius:15px;
                margin-bottom:12px;
                background:#fff;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <div
                    style="
                        display:flex;
                        gap:12px;
                    "
                >

                    <div
                        style="
                            width:45px;
                            height:45px;
                            border-radius:13px;
                            background:#eff9f3;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:20px;
                        "
                    >
                        💊
                    </div>


                    <div>

                        <h3
                            style="
                                margin:0 0 5px;
                                color:#1a4052;
                                font-size:12px;
                            "
                        >
                            Prescription
                        </h3>


                        <p
                            style="
                                margin:0;
                                color:#8197a1;
                                font-size:9px;
                            "
                        >
                            ${formatDate(
                                prescription.date
                            )}

                            ${
                                prescription.doctor
                                    ? `
                                        •
                                        ${escapeHTML(
                                            prescription.doctor
                                        )}
                                      `
                                    : ""
                            }

                        </p>

                    </div>

                </div>

            </div>


            ${
                prescription.notes
                    ? `
                        <div
                            style="
                                margin-top:13px;
                                padding:12px;
                                background:#f8fbfc;
                                border-radius:10px;
                            "
                        >

                            <p
                                style="
                                    margin:0;
                                    color:#5d7682;
                                    font-size:10px;
                                    line-height:1.6;
                                    white-space:pre-wrap;
                                "
                            >
                                ${escapeHTML(
                                    prescription.notes
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                prescription.file
                    ? `
                        <button
                            class="btn-secondary provider-prescription-file-btn"
                            data-prescription-id="${escapeHTML(
                                prescription.id
                            )}"
                            type="button"
                            style="margin-top:12px;"
                        >
                            📎 View Prescription File
                        </button>
                      `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   RENDER PRESCRIPTIONS
   ========================================================= */

function renderSelectedPatientPrescriptions() {

    const container =
        document.getElementById(
            "providerPrescriptionsArea"
        );

    if (!container) {
        return;
    }


    if (!selectedPatient) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    💊
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Select a patient to view
                    prescriptions.
                </p>

            </div>

        `;

        return;
    }


    const prescriptions =
        [...selectedPatient.prescriptions]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt
                    ) -
                    new Date(
                        a.date ||
                        a.createdAt
                    )
            );


    container.innerHTML =

        createSelectedPatientHeader() +

        `

            <h3
                style="
                    margin:0 0 15px;
                    color:#183e50;
                "
            >
                Prescriptions
            </h3>


            ${
                prescriptions.length
                    ? prescriptions
                        .map(
                            createPrescriptionCard
                        )
                        .join("")
                    : `
                        <div class="empty-state">

                            <div class="empty-state-icon">
                                💊
                            </div>

                            <h3>
                                No prescriptions yet
                            </h3>

                            <p>
                                Add a prescription
                                for this patient.
                            </p>

                            <button
                                class="btn-primary"
                                id="providerEmptyAddPrescriptionBtn"
                                type="button"
                            >
                                + Add Prescription
                            </button>

                        </div>
                      `
            }

        `;
}


/* =========================================================
   FILE HANDLING
   ========================================================= */

function validateMedicalFile(file) {

    if (!file) {
        return true;
    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showProviderToast(
            "Only JPG, PNG, WEBP or PDF files are allowed."
        );

        return false;
    }


    const maxSize =
        3 * 1024 * 1024;


    if (file.size > maxSize) {

        showProviderToast(
            "File size must be 3 MB or less."
        );

        return false;
    }


    return true;
}


function fileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {
                resolve(
                    reader.result
                );
            };

            reader.onerror = () => {
                reject(
                    new Error(
                        "File could not be read."
                    )
                );
            };

            reader.readAsDataURL(file);
        }
    );
}


function openStoredFile(file) {

    if (
        !file ||
        !file.data
    ) {

        showProviderToast(
            "No file is attached."
        );

        return;
    }


    const newWindow =
        window.open(
            "",
            "_blank"
        );


    if (!newWindow) {

        showProviderToast(
            "Please allow pop-ups to view the file."
        );

        return;
    }


    if (
        file.type &&
        file.type.startsWith("image/")
    ) {

        newWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    ${escapeHTML(
                        file.name
                    )}
                </title>

                <style>

                    body {
                        margin:0;
                        min-height:100vh;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#111827;
                    }

                    img {
                        max-width:95vw;
                        max-height:95vh;
                        object-fit:contain;
                    }

                </style>

            </head>

            <body>

                <img
                    src="${file.data}"
                    alt="${escapeHTML(
                        file.name
                    )}"
                >

            </body>

            </html>

        `);

    } else {

        newWindow.location.href =
            file.data;
    }
}


/* =========================================================
   MODALS
   ========================================================= */

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    modal.style.display =
        "none";
}


function openRecordModal() {

    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const modal =
        document.getElementById(
            "providerRecordModal"
        );

    const date =
        document.getElementById(
            "providerRecordDate"
        );

    if (date) {
        date.value = getToday();
    }


    if (modal) {

        modal.classList.add("show");

        modal.style.display =
            "flex";
    }
}


function openPrescriptionModal() {

    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const modal =
        document.getElementById(
            "providerPrescriptionModal"
        );

    const date =
        document.getElementById(
            "prescriptionDate"
        );

    if (date) {
        date.value = getToday();
    }


    if (modal) {

        modal.classList.add("show");

        modal.style.display =
            "flex";
    }
}


/* =========================================================
   PATIENT PROFILE
   ========================================================= */

function profileField(
    label,
    value
) {

    return `

        <div
            style="
                padding:14px;
                background:#f8fbfc;
                border-radius:12px;
            "
        >

            <span
                style="
                    display:block;
                    color:#8aa0a9;
                    font-size:8px;
                    margin-bottom:5px;
                    text-transform:uppercase;
                    letter-spacing:.5px;
                "
            >
                ${escapeHTML(label)}
            </span>

            <strong
                style="
                    color:#234a5b;
                    font-size:11px;
                    word-break:break-word;
                "
            >
                ${escapeHTML(value)}
            </strong>

        </div>

    `;
}


function openPatientProfile() {

    if (!selectedPatient) {
        return;
    }


    const modal =
        document.getElementById(
            "patientViewModal"
        );

    const content =
        document.getElementById(
            "patientViewContent"
        );


    if (!modal || !content) {
        return;
    }


    content.innerHTML = `

        <div
            style="
                padding:20px;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:15px;
                    margin-bottom:25px;
                "
            >

                <div
                    style="
                        width:70px;
                        height:70px;
                        border-radius:20px;
                        background:#e6f6fb;
                        color:#15779d;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:20px;
                        font-weight:800;
                    "
                >
                    ${getInitials(
                        selectedPatient.name
                    )}
                </div>


                <div>

                    <h2
                        style="
                            margin:0 0 5px;
                            color:#183d4f;
                        "
                    >
                        ${escapeHTML(
                            selectedPatient.name
                        )}
                    </h2>

                    <p
                        style="
                            margin:0;
                            color:#8096a0;
                            font-size:10px;
                        "
                    >
                        Patient ID:
                        ${escapeHTML(
                            selectedPatient.id
                        )}
                    </p>

                </div>

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(2,minmax(0,1fr));
                    gap:12px;
                "
            >

                ${profileField(
                    "Date of Birth",
                    formatDate(
                        selectedPatient.dob
                    )
                )}

                ${profileField(
                    "Gender",
                    selectedPatient.gender ||
                    "Not provided"
                )}

                ${profileField(
                    "Phone",
                    selectedPatient.phone ||
                    "Not provided"
                )}

                ${profileField(
                    "Email",
                    selectedPatient.email ||
                    "Not provided"
                )}

                ${profileField(
                    "Medical Records",
                    selectedPatient.records.length
                )}

                ${profileField(
                    "Reports",
                    selectedPatient.reports.length
                )}

            </div>

        </div>

    `;


    modal.classList.add("show");

    modal.style.display =
        "flex";
}


/* =========================================================
   SAVE MEDICAL RECORD
   ========================================================= */

async function saveMedicalRecord(event) {

    event.preventDefault();


    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const date =
        document.getElementById(
            "providerRecordDate"
        ).value;

    const type =
        document.getElementById(
            "providerRecordType"
        ).value;

    const doctor =
        document.getElementById(
            "providerDoctorName"
        ).value.trim();

    const hospital =
        document.getElementById(
            "providerHospital"
        ).value.trim();

    const notes =
        document.getElementById(
            "providerRecordNotes"
        ).value.trim();

    const conclusion =
        document.getElementById(
            "providerRecordConclusion"
        ).value.trim();

    const fileInput =
        document.getElementById(
            "providerRecordFile"
        );

    const file =
        fileInput &&
        fileInput.files.length
            ? fileInput.files[0]
            : null;


    if (
        !date ||
        !type ||
        !doctor
    ) {

        showProviderToast(
            "Please fill all required fields."
        );

        return;
    }


    if (!validateMedicalFile(file)) {
        return;
    }


    try {

        let storedFile = null;


        if (file) {

            storedFile = {

                name: file.name,

                type: file.type,

                size: file.size,

                data:
                    await fileToDataURL(
                        file
                    )

            };
        }


        const record = {

            id:
                "REC-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            date,

            type,

            doctor,

            hospital,

            notes,

            conclusion,

            file: storedFile,

            createdAt:
                new Date().toISOString(),

            source: "provider",

            providerId:
                currentProvider
                    ? currentProvider.id
                    : "provider"

        };


        selectedPatient.records.push(
            record
        );


        /*
         * Prescription record also goes
         * into prescription section.
         */

        if (
            type === "Prescription"
        ) {

            selectedPatient.prescriptions.push({

                id:
                    "RX-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                date,

                doctor,

                hospital,

                notes:
                    conclusion ||
                    notes,

                file: storedFile,

                createdAt:
                    new Date().toISOString(),

                source: "provider"

            });

        }


        /*
         * Report types are copied into
         * reports section when a file exists.
         */

        const reportTypes = [

            "ECG",
            "X-Ray",
            "MRI",
            "CT Scan",
            "Blood Test",
            "Lab Report",
            "Cardiology",
            "Respiratory",
            "Neurology",
            "Orthopedic",
            "Dental",
            "Eye"

        ];


        if (
            storedFile &&
            reportTypes.includes(type)
        ) {

            selectedPatient.reports.push({

                id:
                    "REP-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                name:
                    `${type} Report`,

                date,

                type,

                conclusion,

                file: storedFile,

                createdAt:
                    new Date().toISOString(),

                source: "provider"

            });

        }


        updatePatientInStorage(
            selectedPatient
        );


        const form =
            document.getElementById(
                "providerRecordForm"
            );

        if (form) {
            form.reset();
        }


        closeModal(
            "providerRecordModal"
        );


        updateProviderStats();

        renderSelectedPatientRecords();

        renderSelectedPatientReports();

        renderSelectedPatientPrescriptions();


        showProviderToast(
            "Medical record added successfully."
        );


    } catch (error) {

        console.error(error);

        showProviderToast(
            "Could not save medical record."
        );
    }
}


/* =========================================================
   SAVE PRESCRIPTION
   ========================================================= */

async function savePrescription(event) {

    event.preventDefault();


    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const date =
        document.getElementById(
            "prescriptionDate"
        ).value;

    const doctor =
        document.getElementById(
            "prescriptionDoctor"
        ).value.trim();

    const hospital =
        document.getElementById(
            "prescriptionHospital"
        ).value.trim();

    const notes =
        document.getElementById(
            "prescriptionNotes"
        ).value.trim();

    const fileInput =
        document.getElementById(
            "prescriptionFile"
        );

    const file =
        fileInput &&
        fileInput.files.length
            ? fileInput.files[0]
            : null;


    if (
        !date ||
        !doctor ||
        !notes
    ) {

        showProviderToast(
            "Please fill all required fields."
        );

        return;
    }


    if (!validateMedicalFile(file)) {
        return;
    }


    try {

        let storedFile = null;


        if (file) {

            storedFile = {

                name: file.name,

                type: file.type,

                size: file.size,

                data:
                    await fileToDataURL(
                        file
                    )

            };
        }


        const prescription = {

            id:
                "RX-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            date,

            doctor,

            hospital,

            notes,

            file: storedFile,

            createdAt:
                new Date().toISOString(),

            source: "provider",

            providerId:
                currentProvider
                    ? currentProvider.id
                    : "provider"

        };


        selectedPatient.prescriptions.push(
            prescription
        );


        /*
         * Add prescription to medical history too.
         */

        selectedPatient.records.push({

            id:
                "REC-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            date,

            type:
                "Prescription",

            doctor,

            hospital,

            notes,

            conclusion: "",

            file: storedFile,

            createdAt:
                new Date().toISOString(),

            source: "provider",

            providerId:
                currentProvider
                    ? currentProvider.id
                    : "provider"

        });


        /*
         * If prescription file exists,
         * show it in reports/documents.
         */

        if (storedFile) {

            selectedPatient.reports.push({

                id:
                    "REP-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                name:
                    "Prescription Document",

                date,

                type:
                    "Prescription",

                conclusion:
                    notes,

                file: storedFile,

                createdAt:
                    new Date().toISOString(),

                source: "provider"

            });

        }


        updatePatientInStorage(
            selectedPatient
        );


        const form =
            document.getElementById(
                "providerPrescriptionForm"
            );

        if (form) {
            form.reset();
        }


        closeModal(
            "providerPrescriptionModal"
        );


        updateProviderStats();

        renderSelectedPatientRecords();

        renderSelectedPatientReports();

        renderSelectedPatientPrescriptions();


        showProviderToast(
            "Prescription added successfully."
        );


    } catch (error) {

        console.error(error);

        showProviderToast(
            "Could not save prescription."
        );
    }
}


/* =========================================================
   EVENT INITIALIZATION
   ========================================================= */

function initializeProviderDashboard() {

    if (!protectProviderPage()) {
        return;
    }


    updateProviderStats();


    /* -----------------------------------------------------
       SIDEBAR NAVIGATION
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".nav-item[data-provider-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showProviderSection(
                        button.dataset
                            .providerSection
                    );

                }
            );

        });


    /* -----------------------------------------------------
       OVERVIEW SEARCH
    ----------------------------------------------------- */

    const overviewInput =
        document.getElementById(
            "overviewPatientSearch"
        );

    const overviewButton =
        document.getElementById(
            "overviewSearchBtn"
        );


    function runOverviewSearch() {

        const term =
            overviewInput
                ? overviewInput.value
                : "";

        renderPatientSearchResults(
            "overviewSearchResults",
            term
        );
    }


    if (overviewButton) {

        overviewButton.addEventListener(
            "click",
            runOverviewSearch
        );

    }


    if (overviewInput) {

        overviewInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    runOverviewSearch();

                }

            }
        );

    }


    /* -----------------------------------------------------
       PATIENT SEARCH
    ----------------------------------------------------- */

    const patientInput =
        document.getElementById(
            "patientSearchInput"
        );

    const patientButton =
        document.getElementById(
            "patientSearchBtn"
        );


    function runPatientSearch() {

        const term =
            patientInput
                ? patientInput.value
                : "";

        renderPatientSearchResults(
            "patientSearchResults",
            term
        );
    }


    if (patientButton) {

        patientButton.addEventListener(
            "click",
            runPatientSearch
        );

    }


    if (patientInput) {

        patientInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    runPatientSearch();

                }

            }
        );

    }


    /* -----------------------------------------------------
       OVERVIEW BUTTONS
    ----------------------------------------------------- */

    const overviewPatients =
        document.getElementById(
            "overviewPatientsBtn"
        );

    if (overviewPatients) {

        overviewPatients.addEventListener(
            "click",
            () => {

                showProviderSection(
                    "patients"
                );

            }
        );

    }


    const overviewRecords =
        document.getElementById(
            "overviewRecordsBtn"
        );

    if (overviewRecords) {

        overviewRecords.addEventListener(
            "click",
            () => {

                showProviderSection(
                    "records"
                );

            }
        );

    }


    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    const logout =
        document.getElementById(
            "providerLogoutBtn"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    CURRENT_USER_KEY
                );

                window.location.href =
                    "index.html";

            }
        );

    }


    /* -----------------------------------------------------
       MEDICAL RECORD FORM
    ----------------------------------------------------- */

    const recordForm =
        document.getElementById(
            "providerRecordForm"
        );


    if (recordForm) {

        recordForm.addEventListener(
            "submit",
            saveMedicalRecord
        );

    }


    /* -----------------------------------------------------
       PRESCRIPTION FORM
    ----------------------------------------------------- */

    const prescriptionForm =
        document.getElementById(
            "providerPrescriptionForm"
        );


    if (prescriptionForm) {

        prescriptionForm.addEventListener(
            "submit",
            savePrescription
        );

    }


    /* -----------------------------------------------------
       CLOSE RECORD MODAL
    ----------------------------------------------------- */

    const closeRecord =
        document.getElementById(
            "closeProviderRecordModal"
        );

    const cancelRecord =
        document.getElementById(
            "cancelProviderRecordBtn"
        );


    if (closeRecord) {

        closeRecord.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerRecordModal"
                );

            }
        );

    }


    if (cancelRecord) {

        cancelRecord.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerRecordModal"
                );

            }
        );

    }


    /* -----------------------------------------------------
       CLOSE PRESCRIPTION MODAL
    ----------------------------------------------------- */

    const closePrescription =
        document.getElementById(
            "closeProviderPrescriptionModal"
        );

    const cancelPrescription =
        document.getElementById(
            "cancelProviderPrescriptionBtn"
        );


    if (closePrescription) {

        closePrescription.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerPrescriptionModal"
                );

            }
        );

    }


    if (cancelPrescription) {

        cancelPrescription.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerPrescriptionModal"
                );

            }
        );

    }


    /* -----------------------------------------------------
       CLOSE PATIENT PROFILE
    ----------------------------------------------------- */

    const closePatient =
        document.getElementById(
            "closePatientViewModal"
        );


    if (closePatient) {

        closePatient.addEventListener(
            "click",
            () => {

                closeModal(
                    "patientViewModal"
                );

            }
        );

    }


    /* -----------------------------------------------------
       MODAL OUTSIDE CLICK
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                        modal.style.display =
                            "none";
                    }

                }
            );

        });


    /* -----------------------------------------------------
       ESC KEY
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            document
                .querySelectorAll(
                    ".modal-overlay"
                )
                .forEach(modal => {

                    modal.classList.remove(
                        "show"
                    );

                    modal.style.display =
                        "none";

                });

        }
    );


    /* -----------------------------------------------------
       DYNAMIC BUTTONS
    ----------------------------------------------------- */

    document.addEventListener(
        "click",
        event => {

            /* Patient select */

            const patientButton =
                event.target.closest(
                    ".provider-select-patient"
                );


            if (patientButton) {

                selectPatient(
                    patientButton.dataset
                        .patientId
                );

                return;
            }


            /* Record file */

            const recordFileButton =
                event.target.closest(
                    ".provider-file-btn"
                );


            if (recordFileButton) {

                if (!selectedPatient) {
                    return;
                }


                const record =
                    selectedPatient.records.find(
                        item =>
                            item.id ===
                            recordFileButton
                                .dataset
                                .recordFileId
                    );


                if (
                    record &&
                    record.file
                ) {

                    openStoredFile(
                        record.file
                    );
                }

                return;
            }


            /* Report file */

            const reportFileButton =
                event.target.closest(
                    ".provider-report-file-btn"
                );


            if (reportFileButton) {

                if (!selectedPatient) {
                    return;
                }


                const report =
                    selectedPatient.reports.find(
                        item =>
                            item.id ===
                            reportFileButton
                                .dataset
                                .reportId
                    );


                if (
                    report &&
                    report.file
                ) {

                    openStoredFile(
                        report.file
                    );
                }

                return;
            }


            /* Prescription file */

            const prescriptionFileButton =
                event.target.closest(
                    ".provider-prescription-file-btn"
                );


            if (prescriptionFileButton) {

                if (!selectedPatient) {
                    return;
                }


                const prescription =
                    selectedPatient
                        .prescriptions
                        .find(
                            item =>
                                item.id ===
                                prescriptionFileButton
                                    .dataset
                                    .prescriptionId
                        );


                if (
                    prescription &&
                    prescription.file
                ) {

                    openStoredFile(
                        prescription.file
                    );
                }

                return;
            }


            /* Profile */

            if (
                event.target.id ===
                "providerPatientProfileBtn"
            ) {

                openPatientProfile();

                return;
            }


            /* Add record */

            if (
                event.target.id ===
                    "providerAddRecordBtn" ||
                event.target.id ===
                    "providerEmptyAddRecordBtn"
            ) {

                openRecordModal();

                return;
            }


            /* Add prescription */

            if (
                event.target.id ===
                    "providerAddPrescriptionBtn" ||
                event.target.id ===
                    "providerEmptyAddPrescriptionBtn"
            ) {

                openPrescriptionModal();

                return;
            }


            /* Find patient */

            if (
                event.target.id ===
                "recordsFindPatientBtn"
            ) {

                showProviderSection(
                    "patients"
                );

            }

        }
    );


    /* -----------------------------------------------------
       DEFAULT SECTION
    ----------------------------------------------------- */

    showProviderSection(
        "overview"
    );

}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeProviderDashboard
);/* =========================================================
   HEALTH RECORD SYSTEM
   HEALTHCARE PROVIDER / DOCTOR DASHBOARD
   ========================================================= */

const USERS_KEY = "hrs_users";
const CURRENT_USER_KEY = "hrs_current_user";

let currentProvider = null;
let selectedPatient = null;


/* =========================================================
   STORAGE
   ========================================================= */

function getUsers() {
    try {
        const users = JSON.parse(
            localStorage.getItem(USERS_KEY)
        );

        return Array.isArray(users) ? users : [];

    } catch (error) {
        return [];
    }
}


function saveUsers(users) {
    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


function getCurrentUser() {
    try {
        return JSON.parse(
            localStorage.getItem(CURRENT_USER_KEY)
        );
    } catch (error) {
        return null;
    }
}


function updatePatientInStorage(patient) {

    const users = getUsers();

    const index = users.findIndex(
        user => user.id === patient.id
    );

    if (index === -1) {
        return false;
    }

    users[index] = patient;

    saveUsers(users);

    return true;
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getInitials(name) {

    if (!name) {
        return "DR";
    }

    const words = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


function formatDate(value) {

    if (!value) {
        return "Not available";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function getToday() {

    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatFileSize(bytes) {

    if (!bytes) {
        return "";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes / (1024 * 1024)
    ).toFixed(2)} MB`;
}


/* =========================================================
   PATIENT ARRAY INITIALIZATION
   ========================================================= */

function initializePatientArrays(patient) {

    if (!Array.isArray(patient.records)) {
        patient.records = [];
    }

    if (!Array.isArray(patient.reports)) {
        patient.reports = [];
    }

    if (!Array.isArray(patient.prescriptions)) {
        patient.prescriptions = [];
    }

    return patient;
}


/* =========================================================
   TOAST
   ========================================================= */

function showProviderToast(message) {

    const toast =
        document.getElementById(
            "providerToast"
        );

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(
        window.providerToastTimer
    );

    window.providerToastTimer =
        setTimeout(() => {

            toast.style.display = "none";

        }, 2800);
}


/* =========================================================
   PROVIDER PROTECTION
   ========================================================= */

function protectProviderPage() {

    const user = getCurrentUser();

    if (
        !user ||
        user.role !== "provider"
    ) {

        window.location.href =
            "index.html";

        return false;
    }

    currentProvider = user;

    return true;
}


/* =========================================================
   GET PATIENTS
   ========================================================= */

function getPatients() {

    return getUsers().filter(
        user =>
            user.role === "patient"
    );
}


/* =========================================================
   PROVIDER STATISTICS
   ========================================================= */

function updateProviderStats() {

    const patients = getPatients();

    let records = 0;
    let reports = 0;
    let prescriptions = 0;

    patients.forEach(patient => {

        records += Array.isArray(
            patient.records
        )
            ? patient.records.length
            : 0;

        reports += Array.isArray(
            patient.reports
        )
            ? patient.reports.length
            : 0;

        prescriptions += Array.isArray(
            patient.prescriptions
        )
            ? patient.prescriptions.length
            : 0;

    });


    const patientCount =
        document.getElementById(
            "providerPatientCount"
        );

    const recordCount =
        document.getElementById(
            "providerRecordCount"
        );

    const reportCount =
        document.getElementById(
            "providerReportCount"
        );

    const prescriptionCount =
        document.getElementById(
            "providerPrescriptionCount"
        );


    if (patientCount) {
        patientCount.textContent =
            patients.length;
    }

    if (recordCount) {
        recordCount.textContent =
            records;
    }

    if (reportCount) {
        reportCount.textContent =
            reports;
    }

    if (prescriptionCount) {
        prescriptionCount.textContent =
            prescriptions;
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showProviderSection(sectionName) {

    const sections =
        document.querySelectorAll(
            ".provider-section"
        );

    sections.forEach(section => {
        section.style.display = "none";
    });


    const section =
        document.getElementById(
            `provider-${sectionName}`
        );

    if (section) {
        section.style.display = "block";
    }


    const navItems =
        document.querySelectorAll(
            ".nav-item[data-provider-section]"
        );

    navItems.forEach(item => {

        item.classList.remove("active");

        if (
            item.dataset.providerSection ===
            sectionName
        ) {

            item.classList.add("active");
        }

    });


    if (sectionName === "patients") {
        renderAllPatients();
    }

    if (sectionName === "records") {
        renderSelectedPatientRecords();
    }

    if (sectionName === "reports") {
        renderSelectedPatientReports();
    }

    if (sectionName === "prescriptions") {
        renderSelectedPatientPrescriptions();
    }
}


/* =========================================================
   SEARCH PATIENT
   ========================================================= */

function searchPatients(searchTerm) {

    const patients = getPatients();

    const term = String(
        searchTerm || ""
    )
        .trim()
        .toLowerCase();


    if (!term) {
        return patients;
    }


    return patients.filter(patient => {

        const name =
            String(
                patient.name || ""
            ).toLowerCase();

        const phone =
            String(
                patient.phone || ""
            ).toLowerCase();

        const email =
            String(
                patient.email || ""
            ).toLowerCase();


        return (
            name.includes(term) ||
            phone.includes(term) ||
            email.includes(term)
        );
    });
}


/* =========================================================
   PATIENT CARD
   ========================================================= */

function createPatientCard(patient) {

    const recordCount =
        Array.isArray(patient.records)
            ? patient.records.length
            : 0;

    const reportCount =
        Array.isArray(patient.reports)
            ? patient.reports.length
            : 0;


    return `

        <div
            class="patient-result-card"
            style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                padding:18px;
                margin-bottom:12px;
                border:1px solid #e0edf2;
                border-radius:16px;
                background:#ffffff;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:14px;
                    min-width:0;
                "
            >

                <div
                    style="
                        width:48px;
                        height:48px;
                        border-radius:14px;
                        background:#eaf7fc;
                        color:#16779d;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-weight:800;
                        flex-shrink:0;
                    "
                >
                    ${getInitials(
                        patient.name
                    )}
                </div>


                <div style="min-width:0;">

                    <h3
                        style="
                            margin:0 0 5px;
                            font-size:14px;
                            color:#163b4d;
                        "
                    >
                        ${escapeHTML(
                            patient.name
                        )}
                    </h3>

                    <p
                        style="
                            margin:0 0 4px;
                            color:#718b98;
                            font-size:10px;
                        "
                    >
                        📞
                        ${escapeHTML(
                            patient.phone ||
                            "No phone"
                        )}
                    </p>

                    <p
                        style="
                            margin:0;
                            color:#718b98;
                            font-size:10px;
                        "
                    >
                        ✉
                        ${escapeHTML(
                            patient.email ||
                            "No email"
                        )}
                    </p>

                </div>

            </div>


            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    flex-wrap:wrap;
                    justify-content:flex-end;
                "
            >

                <span
                    style="
                        padding:7px 10px;
                        border-radius:20px;
                        background:#f2f8fa;
                        color:#557482;
                        font-size:9px;
                    "
                >
                    ${recordCount} Records
                </span>

                <span
                    style="
                        padding:7px 10px;
                        border-radius:20px;
                        background:#f2f8fa;
                        color:#557482;
                        font-size:9px;
                    "
                >
                    ${reportCount} Reports
                </span>

                <button
                    class="btn-primary provider-select-patient"
                    data-patient-id="${escapeHTML(
                        patient.id
                    )}"
                    type="button"
                >
                    View Patient
                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   RENDER PATIENT SEARCH RESULTS
   ========================================================= */

function renderPatientSearchResults(
    containerId,
    searchTerm
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) {
        return;
    }


    const patients =
        searchPatients(searchTerm);


    if (!patients.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🔍
                </div>

                <h3>
                    No patient found
                </h3>

                <p>
                    Try another name,
                    phone number or email.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        patients
            .map(createPatientCard)
            .join("");
}


/* =========================================================
   RENDER ALL PATIENTS
   ========================================================= */

function renderAllPatients() {

    const input =
        document.getElementById(
            "patientSearchInput"
        );

    const term =
        input
            ? input.value
            : "";

    renderPatientSearchResults(
        "patientSearchResults",
        term
    );
}


/* =========================================================
   SELECT PATIENT
   ========================================================= */

function selectPatient(patientId) {

    const patient =
        getPatients().find(
            user =>
                user.id === patientId
        );


    if (!patient) {

        showProviderToast(
            "Patient not found."
        );

        return;
    }


    selectedPatient =
        initializePatientArrays(
            patient
        );


    showProviderToast(
        `${selectedPatient.name} selected.`
    );


    showProviderSection(
        "records"
    );
}


/* =========================================================
   RECORD ICON
   ========================================================= */

function getRecordIcon(type) {

    const icons = {

        "General Checkup": "🩺",
        "Cardiology": "❤️",
        "Blood Test": "🩸",
        "ECG": "💓",
        "X-Ray": "🦴",
        "MRI": "🧠",
        "CT Scan": "🔬",
        "Respiratory": "🫁",
        "Orthopedic": "🦴",
        "Neurology": "🧠",
        "Dental": "🦷",
        "Eye": "👁️",
        "Prescription": "💊",
        "Lab Report": "🧪",
        "Other": "📋"

    };

    return icons[type] || "📋";
}


/* =========================================================
   SELECTED PATIENT HEADER
   ========================================================= */

function createSelectedPatientHeader() {

    if (!selectedPatient) {

        return `

            <div class="empty-state">

                <div class="empty-state-icon">
                    👤
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Search and select a patient
                    to continue.
                </p>

            </div>

        `;
    }


    return `

        <div
            style="
                padding:20px;
                border-radius:18px;
                background:#f4fbfd;
                border:1px solid #dceef3;
                margin-bottom:20px;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    flex-wrap:wrap;
                "
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:14px;
                    "
                >

                    <div
                        style="
                            width:58px;
                            height:58px;
                            border-radius:18px;
                            background:#dff3fa;
                            color:#15759b;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:16px;
                            font-weight:800;
                        "
                    >
                        ${getInitials(
                            selectedPatient.name
                        )}
                    </div>


                    <div>

                        <h2
                            style="
                                margin:0 0 5px;
                                color:#173d50;
                            "
                        >
                            ${escapeHTML(
                                selectedPatient.name
                            )}
                        </h2>

                        <p
                            style="
                                margin:0;
                                color:#728d99;
                                font-size:10px;
                            "
                        >
                            ${escapeHTML(
                                selectedPatient.phone ||
                                "No phone"
                            )}

                            ${
                                selectedPatient.email
                                    ? `
                                        •
                                        ${escapeHTML(
                                            selectedPatient.email
                                        )}
                                      `
                                    : ""
                            }

                        </p>

                    </div>

                </div>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        class="btn-secondary"
                        id="providerPatientProfileBtn"
                        type="button"
                    >
                        👤 Profile
                    </button>


                    <button
                        class="btn-primary"
                        id="providerAddRecordBtn"
                        type="button"
                    >
                        + Add Record
                    </button>


                    <button
                        class="btn-primary"
                        id="providerAddPrescriptionBtn"
                        type="button"
                    >
                        + Prescription
                    </button>

                </div>

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(4,minmax(0,1fr));
                    gap:10px;
                    margin-top:18px;
                "
            >

                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${selectedPatient.records.length}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Records
                    </small>

                </div>


                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${selectedPatient.reports.length}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Reports
                    </small>

                </div>


                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${selectedPatient.prescriptions.length}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Prescriptions
                    </small>

                </div>


                <div
                    style="
                        background:white;
                        padding:13px;
                        border-radius:12px;
                    "
                >

                    <strong>
                        ${escapeHTML(
                            selectedPatient.gender ||
                            "—"
                        )}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#7c939e;
                            margin-top:3px;
                        "
                    >
                        Gender
                    </small>

                </div>

            </div>

        </div>

    `;
}


/* =========================================================
   RECORD CARD
   ========================================================= */

function createRecordCard(record) {

    return `

        <div
            style="
                border:1px solid #e2edf1;
                border-radius:16px;
                padding:18px;
                margin-bottom:12px;
                background:#fff;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <div
                    style="
                        display:flex;
                        gap:13px;
                    "
                >

                    <div
                        style="
                            width:46px;
                            height:46px;
                            border-radius:14px;
                            background:#eef9fc;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:20px;
                            flex-shrink:0;
                        "
                    >
                        ${getRecordIcon(
                            record.type
                        )}
                    </div>


                    <div>

                        <h3
                            style="
                                margin:0 0 5px;
                                color:#193f51;
                                font-size:13px;
                            "
                        >
                            ${escapeHTML(
                                record.type ||
                                "Medical Record"
                            )}
                        </h3>


                        <p
                            style="
                                margin:0;
                                color:#7b929d;
                                font-size:9px;
                            "
                        >
                            ${formatDate(
                                record.date
                            )}

                            ${
                                record.doctor
                                    ? `
                                        •
                                        ${escapeHTML(
                                            record.doctor
                                        )}
                                      `
                                    : ""
                            }

                        </p>


                        ${
                            record.hospital
                                ? `
                                    <p
                                        style="
                                            margin:4px 0 0;
                                            color:#7b929d;
                                            font-size:9px;
                                        "
                                    >
                                        🏥
                                        ${escapeHTML(
                                            record.hospital
                                        )}
                                    </p>
                                  `
                                : ""
                        }

                    </div>

                </div>


                <span
                    style="
                        padding:6px 9px;
                        border-radius:20px;
                        background:#edf8f1;
                        color:#328158;
                        font-size:8px;
                        font-weight:700;
                        height:max-content;
                    "
                >
                    ${
                        record.source === "provider"
                            ? "Provider Added"
                            : "Patient Added"
                    }
                </span>

            </div>


            ${
                record.notes
                    ? `
                        <div
                            style="
                                margin-top:15px;
                                padding:12px;
                                border-radius:10px;
                                background:#f8fbfc;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#496673;
                                    font-size:9px;
                                    margin-bottom:5px;
                                "
                            >
                                Medical Notes
                            </strong>

                            <p
                                style="
                                    margin:0;
                                    color:#617b87;
                                    font-size:10px;
                                    line-height:1.6;
                                "
                            >
                                ${escapeHTML(
                                    record.notes
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                record.conclusion
                    ? `
                        <div
                            style="
                                margin-top:10px;
                                padding:12px;
                                border-radius:10px;
                                background:#f8fbfc;
                            "
                        >

                            <strong
                                style="
                                    display:block;
                                    color:#496673;
                                    font-size:9px;
                                    margin-bottom:5px;
                                "
                            >
                                Conclusion / Findings
                            </strong>

                            <p
                                style="
                                    margin:0;
                                    color:#617b87;
                                    font-size:10px;
                                    line-height:1.6;
                                "
                            >
                                ${escapeHTML(
                                    record.conclusion
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                record.file
                    ? `
                        <div
                            style="
                                margin-top:12px;
                            "
                        >

                            <button
                                type="button"
                                class="provider-file-btn"
                                data-record-file-id="${escapeHTML(
                                    record.id
                                )}"
                                style="
                                    border:0;
                                    cursor:pointer;
                                    padding:8px 11px;
                                    border-radius:9px;
                                    background:#edf8fb;
                                    color:#167493;
                                    font-size:9px;
                                    font-weight:700;
                                "
                            >
                                📎
                                ${escapeHTML(
                                    record.file.name
                                )}
                            </button>

                            <small
                                style="
                                    color:#91a5ae;
                                    font-size:8px;
                                    margin-left:6px;
                                "
                            >
                                ${formatFileSize(
                                    record.file.size
                                )}
                            </small>

                        </div>
                      `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   RENDER MEDICAL RECORDS
   ========================================================= */

function renderSelectedPatientRecords() {

    const container =
        document.getElementById(
            "selectedPatientRecordArea"
        );

    if (!container) {
        return;
    }


    if (!selectedPatient) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📋
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Search and select a patient
                    to view medical records.
                </p>

                <button
                    class="btn-primary"
                    id="recordsFindPatientBtn"
                    type="button"
                >
                    🔍 Find Patient
                </button>

            </div>

        `;

        return;
    }


    const records =
        [...selectedPatient.records]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt
                    ) -
                    new Date(
                        a.date ||
                        a.createdAt
                    )
            );


    container.innerHTML =

        createSelectedPatientHeader() +

        `

            <h3
                style="
                    margin:0 0 15px;
                    color:#183e50;
                "
            >
                Medical History
            </h3>


            ${
                records.length
                    ? records
                        .map(
                            createRecordCard
                        )
                        .join("")
                    : `
                        <div class="empty-state">

                            <div class="empty-state-icon">
                                📋
                            </div>

                            <h3>
                                No medical records yet
                            </h3>

                            <p>
                                Add the patient's
                                first medical record.
                            </p>

                            <button
                                class="btn-primary"
                                id="providerEmptyAddRecordBtn"
                                type="button"
                            >
                                + Add Medical Record
                            </button>

                        </div>
                      `
            }

        `;
}


/* =========================================================
   REPORT CARD
   ========================================================= */

function createReportCard(report) {

    return `

        <div
            style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:15px;
                padding:16px;
                margin-bottom:12px;
                border:1px solid #e2edf1;
                border-radius:15px;
                background:#fff;
            "
        >

            <div
                style="
                    display:flex;
                    gap:12px;
                    align-items:center;
                "
            >

                <div
                    style="
                        width:45px;
                        height:45px;
                        border-radius:13px;
                        background:#edf8fc;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:19px;
                    "
                >
                    📄
                </div>


                <div>

                    <h3
                        style="
                            margin:0 0 5px;
                            color:#1a4052;
                            font-size:12px;
                        "
                    >
                        ${escapeHTML(
                            report.name ||
                            report.type ||
                            "Medical Report"
                        )}
                    </h3>


                    <p
                        style="
                            margin:0;
                            color:#8298a2;
                            font-size:9px;
                        "
                    >
                        ${formatDate(
                            report.date
                        )}

                        ${
                            report.type
                                ? `
                                    •
                                    ${escapeHTML(
                                        report.type
                                    )}
                                  `
                                : ""
                        }

                    </p>


                    ${
                        report.conclusion
                            ? `
                                <p
                                    style="
                                        margin:6px 0 0;
                                        color:#617985;
                                        font-size:9px;
                                    "
                                >
                                    ${escapeHTML(
                                        report.conclusion
                                    )}
                                </p>
                              `
                            : ""
                    }

                </div>

            </div>


            ${
                report.file
                    ? `
                        <button
                            class="btn-secondary provider-report-file-btn"
                            data-report-id="${escapeHTML(
                                report.id
                            )}"
                            type="button"
                        >
                            📎 View
                        </button>
                      `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   RENDER REPORTS
   ========================================================= */

function renderSelectedPatientReports() {

    const container =
        document.getElementById(
            "providerReportsArea"
        );

    if (!container) {
        return;
    }


    if (!selectedPatient) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    📄
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Select a patient to view reports.
                </p>

            </div>

        `;

        return;
    }


    const reports =
        [...selectedPatient.reports]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt
                    ) -
                    new Date(
                        a.date ||
                        a.createdAt
                    )
            );


    container.innerHTML =

        createSelectedPatientHeader() +

        `

            <h3
                style="
                    margin:0 0 15px;
                    color:#183e50;
                "
            >
                Patient Reports
            </h3>


            <p
                style="
                    color:#8398a1;
                    font-size:9px;
                    margin-top:-8px;
                    margin-bottom:15px;
                "
            >
                ECG, X-Ray, MRI, CT,
                blood reports and other
                medical documents.
            </p>


            ${
                reports.length
                    ? reports
                        .map(
                            createReportCard
                        )
                        .join("")
                    : `
                        <div class="empty-state">

                            <div class="empty-state-icon">
                                📄
                            </div>

                            <h3>
                                No reports available
                            </h3>

                            <p>
                                This patient has not
                                uploaded any reports yet.
                            </p>

                        </div>
                      `
            }

        `;
}


/* =========================================================
   PRESCRIPTION CARD
   ========================================================= */

function createPrescriptionCard(
    prescription
) {

    return `

        <div
            style="
                padding:17px;
                border:1px solid #e2edf1;
                border-radius:15px;
                margin-bottom:12px;
                background:#fff;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <div
                    style="
                        display:flex;
                        gap:12px;
                    "
                >

                    <div
                        style="
                            width:45px;
                            height:45px;
                            border-radius:13px;
                            background:#eff9f3;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:20px;
                        "
                    >
                        💊
                    </div>


                    <div>

                        <h3
                            style="
                                margin:0 0 5px;
                                color:#1a4052;
                                font-size:12px;
                            "
                        >
                            Prescription
                        </h3>


                        <p
                            style="
                                margin:0;
                                color:#8197a1;
                                font-size:9px;
                            "
                        >
                            ${formatDate(
                                prescription.date
                            )}

                            ${
                                prescription.doctor
                                    ? `
                                        •
                                        ${escapeHTML(
                                            prescription.doctor
                                        )}
                                      `
                                    : ""
                            }

                        </p>

                    </div>

                </div>

            </div>


            ${
                prescription.notes
                    ? `
                        <div
                            style="
                                margin-top:13px;
                                padding:12px;
                                background:#f8fbfc;
                                border-radius:10px;
                            "
                        >

                            <p
                                style="
                                    margin:0;
                                    color:#5d7682;
                                    font-size:10px;
                                    line-height:1.6;
                                    white-space:pre-wrap;
                                "
                            >
                                ${escapeHTML(
                                    prescription.notes
                                )}
                            </p>

                        </div>
                      `
                    : ""
            }


            ${
                prescription.file
                    ? `
                        <button
                            class="btn-secondary provider-prescription-file-btn"
                            data-prescription-id="${escapeHTML(
                                prescription.id
                            )}"
                            type="button"
                            style="margin-top:12px;"
                        >
                            📎 View Prescription File
                        </button>
                      `
                    : ""
            }

        </div>

    `;
}


/* =========================================================
   RENDER PRESCRIPTIONS
   ========================================================= */

function renderSelectedPatientPrescriptions() {

    const container =
        document.getElementById(
            "providerPrescriptionsArea"
        );

    if (!container) {
        return;
    }


    if (!selectedPatient) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    💊
                </div>

                <h3>
                    No patient selected
                </h3>

                <p>
                    Select a patient to view
                    prescriptions.
                </p>

            </div>

        `;

        return;
    }


    const prescriptions =
        [...selectedPatient.prescriptions]
            .sort(
                (a, b) =>
                    new Date(
                        b.date ||
                        b.createdAt
                    ) -
                    new Date(
                        a.date ||
                        a.createdAt
                    )
            );


    container.innerHTML =

        createSelectedPatientHeader() +

        `

            <h3
                style="
                    margin:0 0 15px;
                    color:#183e50;
                "
            >
                Prescriptions
            </h3>


            ${
                prescriptions.length
                    ? prescriptions
                        .map(
                            createPrescriptionCard
                        )
                        .join("")
                    : `
                        <div class="empty-state">

                            <div class="empty-state-icon">
                                💊
                            </div>

                            <h3>
                                No prescriptions yet
                            </h3>

                            <p>
                                Add a prescription
                                for this patient.
                            </p>

                            <button
                                class="btn-primary"
                                id="providerEmptyAddPrescriptionBtn"
                                type="button"
                            >
                                + Add Prescription
                            </button>

                        </div>
                      `
            }

        `;
}


/* =========================================================
   FILE HANDLING
   ========================================================= */

function validateMedicalFile(file) {

    if (!file) {
        return true;
    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showProviderToast(
            "Only JPG, PNG, WEBP or PDF files are allowed."
        );

        return false;
    }


    const maxSize =
        3 * 1024 * 1024;


    if (file.size > maxSize) {

        showProviderToast(
            "File size must be 3 MB or less."
        );

        return false;
    }


    return true;
}


function fileToDataURL(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {
                resolve(
                    reader.result
                );
            };

            reader.onerror = () => {
                reject(
                    new Error(
                        "File could not be read."
                    )
                );
            };

            reader.readAsDataURL(file);
        }
    );
}


function openStoredFile(file) {

    if (
        !file ||
        !file.data
    ) {

        showProviderToast(
            "No file is attached."
        );

        return;
    }


    const newWindow =
        window.open(
            "",
            "_blank"
        );


    if (!newWindow) {

        showProviderToast(
            "Please allow pop-ups to view the file."
        );

        return;
    }


    if (
        file.type &&
        file.type.startsWith("image/")
    ) {

        newWindow.document.write(`

            <!DOCTYPE html>

            <html>

            <head>

                <title>
                    ${escapeHTML(
                        file.name
                    )}
                </title>

                <style>

                    body {
                        margin:0;
                        min-height:100vh;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#111827;
                    }

                    img {
                        max-width:95vw;
                        max-height:95vh;
                        object-fit:contain;
                    }

                </style>

            </head>

            <body>

                <img
                    src="${file.data}"
                    alt="${escapeHTML(
                        file.name
                    )}"
                >

            </body>

            </html>

        `);

    } else {

        newWindow.location.href =
            file.data;
    }
}


/* =========================================================
   MODALS
   ========================================================= */

function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    modal.style.display =
        "none";
}


function openRecordModal() {

    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const modal =
        document.getElementById(
            "providerRecordModal"
        );

    const date =
        document.getElementById(
            "providerRecordDate"
        );

    if (date) {
        date.value = getToday();
    }


    if (modal) {

        modal.classList.add("show");

        modal.style.display =
            "flex";
    }
}


function openPrescriptionModal() {

    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const modal =
        document.getElementById(
            "providerPrescriptionModal"
        );

    const date =
        document.getElementById(
            "prescriptionDate"
        );

    if (date) {
        date.value = getToday();
    }


    if (modal) {

        modal.classList.add("show");

        modal.style.display =
            "flex";
    }
}


/* =========================================================
   PATIENT PROFILE
   ========================================================= */

function profileField(
    label,
    value
) {

    return `

        <div
            style="
                padding:14px;
                background:#f8fbfc;
                border-radius:12px;
            "
        >

            <span
                style="
                    display:block;
                    color:#8aa0a9;
                    font-size:8px;
                    margin-bottom:5px;
                    text-transform:uppercase;
                    letter-spacing:.5px;
                "
            >
                ${escapeHTML(label)}
            </span>

            <strong
                style="
                    color:#234a5b;
                    font-size:11px;
                    word-break:break-word;
                "
            >
                ${escapeHTML(value)}
            </strong>

        </div>

    `;
}


function openPatientProfile() {

    if (!selectedPatient) {
        return;
    }


    const modal =
        document.getElementById(
            "patientViewModal"
        );

    const content =
        document.getElementById(
            "patientViewContent"
        );


    if (!modal || !content) {
        return;
    }


    content.innerHTML = `

        <div
            style="
                padding:20px;
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:15px;
                    margin-bottom:25px;
                "
            >

                <div
                    style="
                        width:70px;
                        height:70px;
                        border-radius:20px;
                        background:#e6f6fb;
                        color:#15779d;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:20px;
                        font-weight:800;
                    "
                >
                    ${getInitials(
                        selectedPatient.name
                    )}
                </div>


                <div>

                    <h2
                        style="
                            margin:0 0 5px;
                            color:#183d4f;
                        "
                    >
                        ${escapeHTML(
                            selectedPatient.name
                        )}
                    </h2>

                    <p
                        style="
                            margin:0;
                            color:#8096a0;
                            font-size:10px;
                        "
                    >
                        Patient ID:
                        ${escapeHTML(
                            selectedPatient.id
                        )}
                    </p>

                </div>

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(2,minmax(0,1fr));
                    gap:12px;
                "
            >

                ${profileField(
                    "Date of Birth",
                    formatDate(
                        selectedPatient.dob
                    )
                )}

                ${profileField(
                    "Gender",
                    selectedPatient.gender ||
                    "Not provided"
                )}

                ${profileField(
                    "Phone",
                    selectedPatient.phone ||
                    "Not provided"
                )}

                ${profileField(
                    "Email",
                    selectedPatient.email ||
                    "Not provided"
                )}

                ${profileField(
                    "Medical Records",
                    selectedPatient.records.length
                )}

                ${profileField(
                    "Reports",
                    selectedPatient.reports.length
                )}

            </div>

        </div>

    `;


    modal.classList.add("show");

    modal.style.display =
        "flex";
}


/* =========================================================
   SAVE MEDICAL RECORD
   ========================================================= */

async function saveMedicalRecord(event) {

    event.preventDefault();


    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const date =
        document.getElementById(
            "providerRecordDate"
        ).value;

    const type =
        document.getElementById(
            "providerRecordType"
        ).value;

    const doctor =
        document.getElementById(
            "providerDoctorName"
        ).value.trim();

    const hospital =
        document.getElementById(
            "providerHospital"
        ).value.trim();

    const notes =
        document.getElementById(
            "providerRecordNotes"
        ).value.trim();

    const conclusion =
        document.getElementById(
            "providerRecordConclusion"
        ).value.trim();

    const fileInput =
        document.getElementById(
            "providerRecordFile"
        );

    const file =
        fileInput &&
        fileInput.files.length
            ? fileInput.files[0]
            : null;


    if (
        !date ||
        !type ||
        !doctor
    ) {

        showProviderToast(
            "Please fill all required fields."
        );

        return;
    }


    if (!validateMedicalFile(file)) {
        return;
    }


    try {

        let storedFile = null;


        if (file) {

            storedFile = {

                name: file.name,

                type: file.type,

                size: file.size,

                data:
                    await fileToDataURL(
                        file
                    )

            };
        }


        const record = {

            id:
                "REC-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            date,

            type,

            doctor,

            hospital,

            notes,

            conclusion,

            file: storedFile,

            createdAt:
                new Date().toISOString(),

            source: "provider",

            providerId:
                currentProvider
                    ? currentProvider.id
                    : "provider"

        };


        selectedPatient.records.push(
            record
        );


        /*
         * Prescription record also goes
         * into prescription section.
         */

        if (
            type === "Prescription"
        ) {

            selectedPatient.prescriptions.push({

                id:
                    "RX-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                date,

                doctor,

                hospital,

                notes:
                    conclusion ||
                    notes,

                file: storedFile,

                createdAt:
                    new Date().toISOString(),

                source: "provider"

            });

        }


        /*
         * Report types are copied into
         * reports section when a file exists.
         */

        const reportTypes = [

            "ECG",
            "X-Ray",
            "MRI",
            "CT Scan",
            "Blood Test",
            "Lab Report",
            "Cardiology",
            "Respiratory",
            "Neurology",
            "Orthopedic",
            "Dental",
            "Eye"

        ];


        if (
            storedFile &&
            reportTypes.includes(type)
        ) {

            selectedPatient.reports.push({

                id:
                    "REP-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                name:
                    `${type} Report`,

                date,

                type,

                conclusion,

                file: storedFile,

                createdAt:
                    new Date().toISOString(),

                source: "provider"

            });

        }


        updatePatientInStorage(
            selectedPatient
        );


        const form =
            document.getElementById(
                "providerRecordForm"
            );

        if (form) {
            form.reset();
        }


        closeModal(
            "providerRecordModal"
        );


        updateProviderStats();

        renderSelectedPatientRecords();

        renderSelectedPatientReports();

        renderSelectedPatientPrescriptions();


        showProviderToast(
            "Medical record added successfully."
        );


    } catch (error) {

        console.error(error);

        showProviderToast(
            "Could not save medical record."
        );
    }
}


/* =========================================================
   SAVE PRESCRIPTION
   ========================================================= */

async function savePrescription(event) {

    event.preventDefault();


    if (!selectedPatient) {

        showProviderToast(
            "Please select a patient first."
        );

        return;
    }


    const date =
        document.getElementById(
            "prescriptionDate"
        ).value;

    const doctor =
        document.getElementById(
            "prescriptionDoctor"
        ).value.trim();

    const hospital =
        document.getElementById(
            "prescriptionHospital"
        ).value.trim();

    const notes =
        document.getElementById(
            "prescriptionNotes"
        ).value.trim();

    const fileInput =
        document.getElementById(
            "prescriptionFile"
        );

    const file =
        fileInput &&
        fileInput.files.length
            ? fileInput.files[0]
            : null;


    if (
        !date ||
        !doctor ||
        !notes
    ) {

        showProviderToast(
            "Please fill all required fields."
        );

        return;
    }


    if (!validateMedicalFile(file)) {
        return;
    }


    try {

        let storedFile = null;


        if (file) {

            storedFile = {

                name: file.name,

                type: file.type,

                size: file.size,

                data:
                    await fileToDataURL(
                        file
                    )

            };
        }


        const prescription = {

            id:
                "RX-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            date,

            doctor,

            hospital,

            notes,

            file: storedFile,

            createdAt:
                new Date().toISOString(),

            source: "provider",

            providerId:
                currentProvider
                    ? currentProvider.id
                    : "provider"

        };


        selectedPatient.prescriptions.push(
            prescription
        );


        /*
         * Add prescription to medical history too.
         */

        selectedPatient.records.push({

            id:
                "REC-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            date,

            type:
                "Prescription",

            doctor,

            hospital,

            notes,

            conclusion: "",

            file: storedFile,

            createdAt:
                new Date().toISOString(),

            source: "provider",

            providerId:
                currentProvider
                    ? currentProvider.id
                    : "provider"

        });


        /*
         * If prescription file exists,
         * show it in reports/documents.
         */

        if (storedFile) {

            selectedPatient.reports.push({

                id:
                    "REP-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2, 7),

                name:
                    "Prescription Document",

                date,

                type:
                    "Prescription",

                conclusion:
                    notes,

                file: storedFile,

                createdAt:
                    new Date().toISOString(),

                source: "provider"

            });

        }


        updatePatientInStorage(
            selectedPatient
        );


        const form =
            document.getElementById(
                "providerPrescriptionForm"
            );

        if (form) {
            form.reset();
        }


        closeModal(
            "providerPrescriptionModal"
        );


        updateProviderStats();

        renderSelectedPatientRecords();

        renderSelectedPatientReports();

        renderSelectedPatientPrescriptions();


        showProviderToast(
            "Prescription added successfully."
        );


    } catch (error) {

        console.error(error);

        showProviderToast(
            "Could not save prescription."
        );
    }
}


/* =========================================================
   EVENT INITIALIZATION
   ========================================================= */

function initializeProviderDashboard() {

    if (!protectProviderPage()) {
        return;
    }


    updateProviderStats();


    /* -----------------------------------------------------
       SIDEBAR NAVIGATION
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".nav-item[data-provider-section]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showProviderSection(
                        button.dataset
                            .providerSection
                    );

                }
            );

        });


    /* -----------------------------------------------------
       OVERVIEW SEARCH
    ----------------------------------------------------- */

    const overviewInput =
        document.getElementById(
            "overviewPatientSearch"
        );

    const overviewButton =
        document.getElementById(
            "overviewSearchBtn"
        );


    function runOverviewSearch() {

        const term =
            overviewInput
                ? overviewInput.value
                : "";

        renderPatientSearchResults(
            "overviewSearchResults",
            term
        );
    }


    if (overviewButton) {

        overviewButton.addEventListener(
            "click",
            runOverviewSearch
        );

    }


    if (overviewInput) {

        overviewInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    runOverviewSearch();

                }

            }
        );

    }


    /* -----------------------------------------------------
       PATIENT SEARCH
    ----------------------------------------------------- */

    const patientInput =
        document.getElementById(
            "patientSearchInput"
        );

    const patientButton =
        document.getElementById(
            "patientSearchBtn"
        );


    function runPatientSearch() {

        const term =
            patientInput
                ? patientInput.value
                : "";

        renderPatientSearchResults(
            "patientSearchResults",
            term
        );
    }


    if (patientButton) {

        patientButton.addEventListener(
            "click",
            runPatientSearch
        );

    }


    if (patientInput) {

        patientInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    runPatientSearch();

                }

            }
        );

    }


    /* -----------------------------------------------------
       OVERVIEW BUTTONS
    ----------------------------------------------------- */

    const overviewPatients =
        document.getElementById(
            "overviewPatientsBtn"
        );

    if (overviewPatients) {

        overviewPatients.addEventListener(
            "click",
            () => {

                showProviderSection(
                    "patients"
                );

            }
        );

    }


    const overviewRecords =
        document.getElementById(
            "overviewRecordsBtn"
        );

    if (overviewRecords) {

        overviewRecords.addEventListener(
            "click",
            () => {

                showProviderSection(
                    "records"
                );

            }
        );

    }


    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    const logout =
        document.getElementById(
            "providerLogoutBtn"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    CURRENT_USER_KEY
                );

                window.location.href =
                    "index.html";

            }
        );

    }


    /* -----------------------------------------------------
       MEDICAL RECORD FORM
    ----------------------------------------------------- */

    const recordForm =
        document.getElementById(
            "providerRecordForm"
        );


    if (recordForm) {

        recordForm.addEventListener(
            "submit",
            saveMedicalRecord
        );

    }


    /* -----------------------------------------------------
       PRESCRIPTION FORM
    ----------------------------------------------------- */

    const prescriptionForm =
        document.getElementById(
            "providerPrescriptionForm"
        );


    if (prescriptionForm) {

        prescriptionForm.addEventListener(
            "submit",
            savePrescription
        );

    }


    /* -----------------------------------------------------
       CLOSE RECORD MODAL
    ----------------------------------------------------- */

    const closeRecord =
        document.getElementById(
            "closeProviderRecordModal"
        );

    const cancelRecord =
        document.getElementById(
            "cancelProviderRecordBtn"
        );


    if (closeRecord) {

        closeRecord.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerRecordModal"
                );

            }
        );

    }


    if (cancelRecord) {

        cancelRecord.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerRecordModal"
                );

            }
        );

    }


    /* -----------------------------------------------------
       CLOSE PRESCRIPTION MODAL
    ----------------------------------------------------- */

    const closePrescription =
        document.getElementById(
            "closeProviderPrescriptionModal"
        );

    const cancelPrescription =
        document.getElementById(
            "cancelProviderPrescriptionBtn"
        );


    if (closePrescription) {

        closePrescription.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerPrescriptionModal"
                );

            }
        );

    }


    if (cancelPrescription) {

        cancelPrescription.addEventListener(
            "click",
            () => {

                closeModal(
                    "providerPrescriptionModal"
                );

            }
        );

    }


    /* -----------------------------------------------------
       CLOSE PATIENT PROFILE
    ----------------------------------------------------- */

    const closePatient =
        document.getElementById(
            "closePatientViewModal"
        );


    if (closePatient) {

        closePatient.addEventListener(
            "click",
            () => {

                closeModal(
                    "patientViewModal"
                );

            }
        );

    }


    /* -----------------------------------------------------
       MODAL OUTSIDE CLICK
    ----------------------------------------------------- */

    document
        .querySelectorAll(
            ".modal-overlay"
        )
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "show"
                        );

                        modal.style.display =
                            "none";
                    }

                }
            );

        });


    /* -----------------------------------------------------
       ESC KEY
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }


            document
                .querySelectorAll(
                    ".modal-overlay"
                )
                .forEach(modal => {

                    modal.classList.remove(
                        "show"
                    );

                    modal.style.display =
                        "none";

                });

        }
    );


    /* -----------------------------------------------------
       DYNAMIC BUTTONS
    ----------------------------------------------------- */

    document.addEventListener(
        "click",
        event => {

            /* Patient select */

            const patientButton =
                event.target.closest(
                    ".provider-select-patient"
                );


            if (patientButton) {

                selectPatient(
                    patientButton.dataset
                        .patientId
                );

                return;
            }


            /* Record file */

            const recordFileButton =
                event.target.closest(
                    ".provider-file-btn"
                );


            if (recordFileButton) {

                if (!selectedPatient) {
                    return;
                }


                const record =
                    selectedPatient.records.find(
                        item =>
                            item.id ===
                            recordFileButton
                                .dataset
                                .recordFileId
                    );


                if (
                    record &&
                    record.file
                ) {

                    openStoredFile(
                        record.file
                    );
                }

                return;
            }


            /* Report file */

            const reportFileButton =
                event.target.closest(
                    ".provider-report-file-btn"
                );


            if (reportFileButton) {

                if (!selectedPatient) {
                    return;
                }


                const report =
                    selectedPatient.reports.find(
                        item =>
                            item.id ===
                            reportFileButton
                                .dataset
                                .reportId
                    );


                if (
                    report &&
                    report.file
                ) {

                    openStoredFile(
                        report.file
                    );
                }

                return;
            }


            /* Prescription file */

            const prescriptionFileButton =
                event.target.closest(
                    ".provider-prescription-file-btn"
                );


            if (prescriptionFileButton) {

                if (!selectedPatient) {
                    return;
                }


                const prescription =
                    selectedPatient
                        .prescriptions
                        .find(
                            item =>
                                item.id ===
                                prescriptionFileButton
                                    .dataset
                                    .prescriptionId
                        );


                if (
                    prescription &&
                    prescription.file
                ) {

                    openStoredFile(
                        prescription.file
                    );
                }

                return;
            }


            /* Profile */

            if (
                event.target.id ===
                "providerPatientProfileBtn"
            ) {

                openPatientProfile();

                return;
            }


            /* Add record */

            if (
                event.target.id ===
                    "providerAddRecordBtn" ||
                event.target.id ===
                    "providerEmptyAddRecordBtn"
            ) {

                openRecordModal();

                return;
            }


            /* Add prescription */

            if (
                event.target.id ===
                    "providerAddPrescriptionBtn" ||
                event.target.id ===
                    "providerEmptyAddPrescriptionBtn"
            ) {

                openPrescriptionModal();

                return;
            }


            /* Find patient */

            if (
                event.target.id ===
                "recordsFindPatientBtn"
            ) {

                showProviderSection(
                    "patients"
                );

            }

        }
    );


    /* -----------------------------------------------------
       DEFAULT SECTION
    ----------------------------------------------------- */

    showProviderSection(
        "overview"
    );

}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeProviderDashboard
);