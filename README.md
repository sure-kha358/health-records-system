/* =========================================================
   HEALTH RECORD SYSTEM
   HEALTHCARE PROVIDER / DOCTOR DASHBOARD
   ========================================================= */

const USERS_KEY = "hrs_users";
const CURRENT_USER_KEY = "hrs_current_user";

let providerUser = null;
let patients = [];
let selectedPatient = null;


/* =========================================================
   LOCAL STORAGE HELPERS
   ========================================================= */

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch (error) {
        return null;
    }
}

function saveCurrentUser(user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function logoutProvider() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = "index.html";
}


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
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

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
}


function formatDate(dateString) {
    if (!dateString) {
        return "Not available";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function showToast(message) {
    const toast = document.getElementById("providerToast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.providerToastTimer);

    window.providerToastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    providerUser = getCurrentUser();

    /*
        Provider login currently uses the demo provider:
        doctor@hrs.com / doctor123
    */

    if (!providerUser || providerUser.role !== "provider") {
        window.location.href = "index.html";
        return;
    }

    loadPatients();
    setupProviderInterface();
    loadProviderProfile();
    updateProviderStats();
    renderPatientDirectory();
    renderReports();
    renderPrescriptions();

    const today = getToday();

    const recordDate = document.getElementById("providerRecordDate");
    const prescriptionDate = document.getElementById("prescriptionDate");

    if (recordDate) {
        recordDate.value = today;
    }

    if (prescriptionDate) {
        prescriptionDate.value = today;
    }
});


/* =========================================================
   LOAD PATIENTS
   ========================================================= */

function loadPatients() {

    const users = getUsers();

    patients = users
        .filter(user => user.role === "patient")
        .map(user => {

            if (!Array.isArray(user.records)) {
                user.records = [];
            }

            if (!Array.isArray(user.reports)) {
                user.reports = [];
            }

            if (!Array.isArray(user.prescriptions)) {
                user.prescriptions = [];
            }

            return user;
        });

    /*
        Keep normalized patient data in local storage.
    */

    saveUsers(users);
}


/* =========================================================
   PROVIDER PROFILE
   ========================================================= */

function loadProviderProfile() {

    const providerName =
        providerUser.name ||
        providerUser.fullName ||
        "Healthcare Provider";

    const initials = getInitials(providerName);

    const sidebarName =
        document.getElementById("sidebarProviderName");

    const sidebarAvatar =
        document.getElementById("sidebarProviderAvatar");

    const topName =
        document.getElementById("topProviderName");

    const topAvatar =
        document.getElementById("topProviderAvatar");

    if (sidebarName) {
        sidebarName.textContent = providerName;
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
    }

    if (topName) {
        topName.textContent = providerName;
    }

    if (topAvatar) {
        topAvatar.textContent = initials;
    }
}


/* =========================================================
   PROVIDER NAVIGATION
   ========================================================= */

function setupProviderInterface() {

    const navButtons =
        document.querySelectorAll("[data-provider-section]");

    navButtons.forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.getAttribute("data-provider-section");

            showProviderSection(section);

        });

    });


    const quickActions =
        document.querySelectorAll("[data-go-section]");

    quickActions.forEach(button => {

        button.addEventListener("click", () => {

            const section =
                button.getAttribute("data-go-section");

            showProviderSection(section);

        });

    });


    const logoutButton =
        document.getElementById("providerLogoutBtn");

    if (logoutButton) {
        logoutButton.addEventListener("click", logoutProvider);
    }


    /* Search */

    const overviewSearch =
        document.getElementById("overviewSearchBtn");

    if (overviewSearch) {
        overviewSearch.addEventListener(
            "click",
            performOverviewSearch
        );
    }


    const overviewInput =
        document.getElementById("overviewPatientSearch");

    if (overviewInput) {

        overviewInput.addEventListener("keydown", event => {

            if (event.key === "Enter") {
                performOverviewSearch();
            }

        });

    }


    const directorySearch =
        document.getElementById("directorySearchBtn");

    if (directorySearch) {
        directorySearch.addEventListener(
            "click",
            performDirectorySearch
        );
    }


    const directoryInput =
        document.getElementById("patientDirectorySearch");

    if (directoryInput) {

        directoryInput.addEventListener("input", () => {
            renderPatientDirectory(directoryInput.value);
        });

    }


    /* Add record */

    const addRecordButton =
        document.getElementById("addRecordProviderBtn");

    if (addRecordButton) {

        addRecordButton.addEventListener("click", () => {

            if (!selectedPatient) {
                showToast("Please select a patient first.");
                showProviderSection("patients");
                return;
            }

            openRecordModal();

        });

    }


    /* Add prescription */

    const addPrescriptionButton =
        document.getElementById("addPrescriptionProviderBtn");

    if (addPrescriptionButton) {

        addPrescriptionButton.addEventListener("click", () => {

            if (!selectedPatient) {
                showToast("Please select a patient first.");
                showProviderSection("patients");
                return;
            }

            openPrescriptionModal();

        });

    }


    setupRecordModal();
    setupPrescriptionModal();


    /* Close modal when clicking background */

    document.addEventListener("click", event => {

        if (
            event.target.classList.contains("provider-modal")
        ) {
            event.target.classList.remove("active");
        }

    });


    /* ESC */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            document
                .querySelectorAll(".provider-modal.active")
                .forEach(modal => {
                    modal.classList.remove("active");
                });

        }

    });
}


/* =========================================================
   SHOW SECTION
   ========================================================= */

function showProviderSection(sectionName) {

    const sections =
        document.querySelectorAll(".provider-section");

    sections.forEach(section => {
        section.classList.remove("active");
    });


    const navButtons =
        document.querySelectorAll("[data-provider-section]");

    navButtons.forEach(button => {
        button.classList.remove("active");
    });


    const target =
        document.getElementById(`provider-${sectionName}`);

    if (target) {
        target.classList.add("active");
    }


    const activeButton =
        document.querySelector(
            `[data-provider-section="${sectionName}"]`
        );

    if (activeButton) {
        activeButton.classList.add("active");
    }


    updateProviderPageTitle(sectionName);


    if (sectionName === "patients") {
        renderPatientDirectory();
    }

    if (sectionName === "records") {
        renderSelectedPatientRecords();
    }

    if (sectionName === "reports") {
        renderReports();
    }

    if (sectionName === "prescriptions") {
        renderPrescriptions();
    }
}


/* =========================================================
   PAGE TITLES
   ========================================================= */

function updateProviderPageTitle(section) {

    const title =
        document.getElementById("providerPageTitle");

    const subtitle =
        document.getElementById("providerPageSubtitle");

    const pageData = {

        overview: {
            title: "Provider Overview",
            subtitle:
                "Manage patient health records and medical information"
        },

        patients: {
            title: "Patients",
            subtitle:
                "Search and view registered patient information"
        },

        records: {
            title: "Medical Records",
            subtitle:
                "Review and update patient medical history"
        },

        reports: {
            title: "Patient Reports",
            subtitle:
                "View medical and laboratory reports"
        },

        prescriptions: {
            title: "Prescriptions",
            subtitle:
                "Manage patient prescriptions"
        }

    };


    const data =
        pageData[section] || pageData.overview;


    if (title) {
        title.textContent = data.title;
    }

    if (subtitle) {
        subtitle.textContent = data.subtitle;
    }
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateProviderStats() {

    let records = 0;
    let reports = 0;
    let prescriptions = 0;

    patients.forEach(patient => {

        records += Array.isArray(patient.records)
            ? patient.records.length
            : 0;

        reports += Array.isArray(patient.reports)
            ? patient.reports.length
            : 0;

        prescriptions += Array.isArray(patient.prescriptions)
            ? patient.prescriptions.length
            : 0;

    });


    const totalPatients =
        document.getElementById("totalPatients");

    const totalRecords =
        document.getElementById("totalRecords");

    const totalReports =
        document.getElementById("totalReports");

    const totalPrescriptions =
        document.getElementById("totalPrescriptions");


    if (totalPatients) {
        totalPatients.textContent = patients.length;
    }

    if (totalRecords) {
        totalRecords.textContent = records;
    }

    if (totalReports) {
        totalReports.textContent = reports;
    }

    if (totalPrescriptions) {
        totalPrescriptions.textContent = prescriptions;
    }
}


/* =========================================================
   SEARCH
   ========================================================= */

function searchPatients(query) {

    const value =
        String(query || "").trim().toLowerCase();

    if (!value) {
        return patients;
    }

    return patients.filter(patient => {

        const name =
            String(patient.name || "").toLowerCase();

        const phone =
            String(patient.phone || "").toLowerCase();

        const email =
            String(patient.email || "").toLowerCase();

        return (
            name.includes(value) ||
            phone.includes(value) ||
            email.includes(value)
        );

    });
}


/* =========================================================
   OVERVIEW SEARCH
   ========================================================= */

function performOverviewSearch() {

    const input =
        document.getElementById("overviewPatientSearch");

    const results =
        document.getElementById("overviewPatientResults");

    if (!input || !results) {
        return;
    }

    const query = input.value.trim();

    const matchedPatients =
        searchPatients(query);


    if (!query) {

        results.innerHTML = `
            <div class="provider-empty">
                <div class="provider-empty-icon">🔎</div>
                <h3>Search for a patient</h3>
                <p>Enter patient name, phone or email above.</p>
            </div>
        `;

        return;
    }


    if (matchedPatients.length === 0) {

        results.innerHTML = `
            <div class="provider-empty">
                <div class="provider-empty-icon">😕</div>
                <h3>No Patient Found</h3>
                <p>No patient matched "${escapeHTML(query)}".</p>
            </div>
        `;

        return;
    }


    results.innerHTML =
        matchedPatients
            .slice(0, 8)
            .map(createPatientListItem)
            .join("");


    attachPatientClickEvents(results);
}


/* =========================================================
   PATIENT DIRECTORY
   ========================================================= */

function performDirectorySearch() {

    const input =
        document.getElementById("patientDirectorySearch");

    if (!input) {
        return;
    }

    renderPatientDirectory(input.value);
}


function renderPatientDirectory(searchValue = "") {

    const container =
        document.getElementById("patientDirectory");

    if (!container) {
        return;
    }


    const matchedPatients =
        searchPatients(searchValue);


    if (matchedPatients.length === 0) {

        container.innerHTML = `
            <div class="provider-empty">
                <div class="provider-empty-icon">👥</div>
                <h3>No Patients Found</h3>
                <p>There are no registered patients matching your search.</p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        matchedPatients
            .map(createPatientListItem)
            .join("");


    attachPatientClickEvents(container);
}


/* =========================================================
   CREATE PATIENT ITEM
   ========================================================= */

function createPatientListItem(patient) {

    const initials =
        getInitials(patient.name);

    const recordsCount =
        Array.isArray(patient.records)
            ? patient.records.length
            : 0;

    return `
        <div
            class="patient-item"
            data-patient-id="${escapeHTML(patient.id)}"
        >

            <div class="patient-item-avatar">
                ${escapeHTML(initials)}
            </div>

            <div class="patient-item-info">

                <strong>
                    ${escapeHTML(patient.name || "Unnamed Patient")}
                </strong>

                <span>
                    ${escapeHTML(patient.phone || "No phone")}
                    • ${recordsCount} record${recordsCount === 1 ? "" : "s"}
                </span>

            </div>

            <div class="patient-item-arrow">
                →
            </div>

        </div>
    `;
}


function attachPatientClickEvents(container) {

    const items =
        container.querySelectorAll("[data-patient-id]");

    items.forEach(item => {

        item.addEventListener("click", () => {

            const patientId =
                item.getAttribute("data-patient-id");

            selectPatient(patientId);

        });

    });
}


/* =========================================================
   SELECT PATIENT
   ========================================================= */

function selectPatient(patientId) {

    const found =
        patients.find(
            patient => String(patient.id) === String(patientId)
        );

    if (!found) {
        showToast("Patient information not found.");
        return;
    }


    selectedPatient = found;


    showProviderSection("records");


    renderSelectedPatientRecords();


    showToast(
        `${selectedPatient.name}'s records opened.`
    );
}


/* =========================================================
   PATIENT PROFILE + RECORDS
   ========================================================= */

function renderSelectedPatientRecords() {

    const container =
        document.getElementById(
            "selectedPatientProfileRecords"
        );

    const selectedText =
        document.getElementById(
            "selectedPatientRecordText"
        );


    if (!container) {
        return;
    }


    if (!selectedPatient) {

        if (selectedText) {
            selectedText.textContent =
                "Select a patient to view medical records";
        }

        container.innerHTML = `
            <div class="provider-panel">

                <div class="provider-empty">
                    <div class="provider-empty-icon">📋</div>

                    <h3>No Patient Selected</h3>

                    <p>
                        Go to Patients and select a patient
                        to view their medical history.
                    </p>
                </div>

            </div>
        `;

        return;
    }


    if (selectedText) {
        selectedText.textContent =
            `${selectedPatient.name}'s medical history`;
    }


    const records =
        Array.isArray(selectedPatient.records)
            ? selectedPatient.records
            : [];


    const gender =
        selectedPatient.gender || "Not available";

    const dob =
        selectedPatient.dob || "Not available";

    const phone =
        selectedPatient.phone || "Not available";

    const email =
        selectedPatient.email || "Not provided";


    container.innerHTML = `

        <div class="patient-profile-card">

            <div class="patient-profile-head">

                <div class="patient-big-avatar">
                    ${escapeHTML(
                        getInitials(selectedPatient.name)
                    )}
                </div>

                <div>

                    <h2>
                        ${escapeHTML(
                            selectedPatient.name || "Patient"
                        )}
                    </h2>

                    <p>
                        Patient ID:
                        ${escapeHTML(
                            selectedPatient.id || "N/A"
                        )}
                    </p>

                </div>

            </div>


            <div class="patient-info-grid">

                <div class="patient-info-box">
                    <span>Date of Birth</span>
                    <strong>
                        ${escapeHTML(formatDate(dob))}
                    </strong>
                </div>

                <div class="patient-info-box">
                    <span>Gender</span>
                    <strong>
                        ${escapeHTML(gender)}
                    </strong>
                </div>

                <div class="patient-info-box">
                    <span>Phone</span>
                    <strong>
                        ${escapeHTML(phone)}
                    </strong>
                </div>

                <div class="patient-info-box">
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(email)}
                    </strong>
                </div>

            </div>

        </div>


        <div class="provider-panel">

            <div class="provider-panel-header">

                <div>
                    <h3>Medical History</h3>
                    <span>
                        ${records.length}
                        record${records.length === 1 ? "" : "s"}
                    </span>
                </div>

                <button
                    class="provider-btn"
                    id="inlineAddRecordBtn"
                >
                    + Add Record
                </button>

            </div>


            <div class="records-list" id="selectedPatientRecordsList">

                ${
                    records.length === 0
                    ? `
                        <div class="provider-empty">
                            <div class="provider-empty-icon">📋</div>

                            <h3>No Medical Records</h3>

                            <p>
                                This patient does not have
                                any medical records yet.
                            </p>
                        </div>
                    `
                    : records
                        .slice()
                        .reverse()
                        .map(createProviderRecordCard)
                        .join("")
                }

            </div>

        </div>
    `;


    const inlineButton =
        document.getElementById("inlineAddRecordBtn");

    if (inlineButton) {

        inlineButton.addEventListener(
            "click",
            openRecordModal
        );

    }
}


/* =========================================================
   RECORD CARD
   ========================================================= */

function createProviderRecordCard(record) {

    const type =
        record.type || "Medical Record";

    const date =
        record.date || record.createdAt;

    const doctor =
        record.doctor || "Not specified";

    const hospital =
        record.hospital || "Not specified";

    const notes =
        record.notes || "No notes provided.";

    const conclusion =
        record.conclusion || "No conclusion provided.";


    return `
        <div class="provider-record-card">

            <div class="provider-record-head">

                <div class="provider-record-title">

                    <div class="provider-record-icon">
                        ${getRecordIcon(type)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(type)}
                        </strong>

                        <span>
                            ${escapeHTML(formatDate(date))}
                        </span>

                    </div>

                </div>

            </div>


            <div class="provider-record-body">

                <p>
                    <strong>Doctor:</strong>
                    ${escapeHTML(doctor)}
                </p>

                <p>
                    <strong>Hospital / Clinic:</strong>
                    ${escapeHTML(hospital)}
                </p>

                <p>
                    <strong>Medical Notes:</strong>
                    ${escapeHTML(notes)}
                </p>

                <p>
                    <strong>Conclusion:</strong>
                    ${escapeHTML(conclusion)}
                </p>

            </div>

        </div>
    `;
}


function getRecordIcon(type) {

    const icons = {
        "General Checkup": "🩺",
        "Cardiology": "❤️",
        "Blood Test": "🩸",
        "ECG": "💓",
        "Respiratory": "🫁",
        "Orthopedic": "🦴",
        "Neurology": "🧠",
        "Dental": "🦷",
        "Eye": "👁️",
        "Other": "📋"
    };

    return icons[type] || "📋";
}


/* =========================================================
   RECORD MODAL
   ========================================================= */

function setupRecordModal() {

    const closeButton =
        document.getElementById(
            "closeProviderRecordModal"
        );

    const cancelButton =
        document.getElementById(
            "cancelProviderRecord"
        );

    const form =
        document.getElementById(
            "providerRecordForm"
        );


    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeRecordModal
        );
    }


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeRecordModal
        );
    }


    if (form) {

        form.addEventListener("submit", event => {

            event.preventDefault();

            saveProviderRecord();

        });

    }
}


function openRecordModal() {

    if (!selectedPatient) {
        showToast("Please select a patient first.");
        return;
    }


    const modal =
        document.getElementById(
            "providerRecordModal"
        );

    const patientInput =
        document.getElementById(
            "providerRecordPatient"
        );

    const dateInput =
        document.getElementById(
            "providerRecordDate"
        );

    const doctorInput =
        document.getElementById(
            "providerDoctorName"
        );


    if (patientInput) {
        patientInput.value =
            selectedPatient.name || "";
    }


    if (dateInput) {
        dateInput.value = getToday();
    }


    if (doctorInput) {

        doctorInput.value =
            providerUser.name ||
            "Healthcare Provider";

    }


    if (modal) {
        modal.classList.add("active");
    }
}


function closeRecordModal() {

    const modal =
        document.getElementById(
            "providerRecordModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }
}


function saveProviderRecord() {

    if (!selectedPatient) {
        showToast("Please select a patient.");
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


    if (!date || !type || !doctor) {

        showToast(
            "Please fill all required fields."
        );

        return;
    }


    if (!Array.isArray(selectedPatient.records)) {
        selectedPatient.records = [];
    }


    const newRecord = {

        id:
            "REC-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 7),

        date: date,

        type: type,

        doctor: doctor,

        hospital: hospital,

        notes: notes,

        conclusion: conclusion,

        addedBy: "Healthcare Provider",

        createdAt:
            new Date().toISOString()

    };


    selectedPatient.records.push(newRecord);


    updatePatientInStorage();


    closeRecordModal();


    document
        .getElementById("providerRecordForm")
        .reset();


    document
        .getElementById("providerRecordDate")
        .value = getToday();


    renderSelectedPatientRecords();

    updateProviderStats();

    showToast(
        "Medical record added successfully."
    );
}


/* =========================================================
   PRESCRIPTION MODAL
   ========================================================= */

function setupPrescriptionModal() {

    const closeButton =
        document.getElementById(
            "closeProviderPrescriptionModal"
        );

    const cancelButton =
        document.getElementById(
            "cancelProviderPrescription"
        );

    const form =
        document.getElementById(
            "providerPrescriptionForm"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePrescriptionModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closePrescriptionModal
        );

    }


    if (form) {

        form.addEventListener("submit", event => {

            event.preventDefault();

            saveProviderPrescription();

        });

    }
}


function openPrescriptionModal() {

    if (!selectedPatient) {

        showToast(
            "Please select a patient first."
        );

        return;
    }


    const modal =
        document.getElementById(
            "providerPrescriptionModal"
        );

    const patientInput =
        document.getElementById(
            "prescriptionPatient"
        );

    const dateInput =
        document.getElementById(
            "prescriptionDate"
        );


    if (patientInput) {

        patientInput.value =
            selectedPatient.name || "";

    }


    if (dateInput) {
        dateInput.value = getToday();
    }


    if (modal) {
        modal.classList.add("active");
    }
}


function closePrescriptionModal() {

    const modal =
        document.getElementById(
            "providerPrescriptionModal"
        );

    if (modal) {
        modal.classList.remove("active");
    }
}


function saveProviderPrescription() {

    if (!selectedPatient) {

        showToast(
            "Please select a patient."
        );

        return;
    }


    const date =
        document.getElementById(
            "prescriptionDate"
        ).value;

    const medicine =
        document.getElementById(
            "medicineName"
        ).value.trim();

    const dosage =
        document.getElementById(
            "medicineDosage"
        ).value.trim();

    const frequency =
        document.getElementById(
            "medicineFrequency"
        ).value.trim();

    const duration =
        document.getElementById(
            "medicineDuration"
        ).value.trim();

    const instructions =
        document.getElementById(
            "medicineInstructions"
        ).value.trim();


    if (!date || !medicine || !dosage) {

        showToast(
            "Please enter date, medicine and dosage."
        );

        return;
    }


    if (!Array.isArray(selectedPatient.prescriptions)) {

        selectedPatient.prescriptions = [];

    }


    const newPrescription = {

        id:
            "RX-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 7),

        date: date,

        medicine: medicine,

        dosage: dosage,

        frequency: frequency,

        duration: duration,

        instructions: instructions,

        doctor:
            providerUser.name ||
            "Healthcare Provider",

        createdAt:
            new Date().toISOString()

    };


    selectedPatient.prescriptions.push(
        newPrescription
    );


    updatePatientInStorage();


    closePrescriptionModal();


    document
        .getElementById("providerPrescriptionForm")
        .reset();


    document
        .getElementById("prescriptionDate")
        .value = getToday();


    renderPrescriptions();

    updateProviderStats();

    showToast(
        "Prescription added successfully."
    );
}


/* =========================================================
   UPDATE PATIENT IN LOCAL STORAGE
   ========================================================= */

function updatePatientInStorage() {

    if (!selectedPatient) {
        return;
    }


    const users = getUsers();


    const index =
        users.findIndex(
            user =>
                String(user.id) ===
                String(selectedPatient.id)
        );


    if (index === -1) {
        return;
    }


    users[index] = selectedPatient;


    saveUsers(users);


    /*
        Refresh the local patient array
        so provider dashboard stays updated.
    */

    patients = users.filter(
        user => user.role === "patient"
    );
}


/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {

    const container =
        document.getElementById(
            "providerReportsList"
        );

    if (!container) {
        return;
    }


    const reports = [];


    patients.forEach(patient => {

        const patientReports =
            Array.isArray(patient.reports)
                ? patient.reports
                : [];


        patientReports.forEach(report => {

            reports.push({
                patient,
                report
            });

        });

    });


    if (reports.length === 0) {

        container.innerHTML = `
            <div class="provider-panel">

                <div class="provider-empty">

                    <div class="provider-empty-icon">
                        📄
                    </div>

                    <h3>No Reports Available</h3>

                    <p>
                        Patient uploaded reports will
                        appear here.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="provider-table-wrap">

            <table class="provider-table">

                <thead>

                    <tr>

                        <th>Patient</th>
                        <th>Report</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Conclusion</th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        reports
                            .slice()
                            .reverse()
                            .map(item => {

                                const patient =
                                    item.patient;

                                const report =
                                    item.report;

                                return `
                                    <tr>

                                        <td>
                                            <strong>
                                                ${escapeHTML(
                                                    patient.name
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                report.name ||
                                                report.fileName ||
                                                "Medical Report"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                report.type ||
                                                report.reportType ||
                                                "General"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                formatDate(
                                                    report.date
                                                )
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                report.conclusion ||
                                                "Not provided"
                                            )}
                                        </td>

                                    </tr>
                                `;

                            })
                            .join("")
                    }

                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   PRESCRIPTIONS
   ========================================================= */

function renderPrescriptions() {

    const container =
        document.getElementById(
            "providerPrescriptionsList"
        );

    if (!container) {
        return;
    }


    const prescriptions = [];


    patients.forEach(patient => {

        const patientPrescriptions =
            Array.isArray(patient.prescriptions)
                ? patient.prescriptions
                : [];


        patientPrescriptions.forEach(prescription => {

            prescriptions.push({
                patient,
                prescription
            });

        });

    });


    if (prescriptions.length === 0) {

        container.innerHTML = `
            <div class="provider-panel">

                <div class="provider-empty">

                    <div class="provider-empty-icon">
                        💊
                    </div>

                    <h3>No Prescriptions</h3>

                    <p>
                        Prescriptions added by healthcare
                        providers will appear here.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="provider-table-wrap">

            <table class="provider-table">

                <thead>

                    <tr>

                        <th>Patient</th>
                        <th>Medicine</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Date</th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        prescriptions
                            .slice()
                            .reverse()
                            .map(item => {

                                const patient =
                                    item.patient;

                                const prescription =
                                    item.prescription;

                                return `
                                    <tr>

                                        <td>
                                            <strong>
                                                ${escapeHTML(
                                                    patient.name
                                                )}
                                            </strong>
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                prescription.medicine ||
                                                "Medicine"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                prescription.dosage ||
                                                "-"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                prescription.frequency ||
                                                "-"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                prescription.duration ||
                                                "-"
                                            )}
                                        </td>

                                        <td>
                                            ${escapeHTML(
                                                formatDate(
                                                    prescription.date
                                                )
                                            )}
                                        </td>

                                    </tr>
                                `;

                            })
                            .join("")
                    }

                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   REFRESH DATA
   ========================================================= */

window.addEventListener("storage", () => {

    loadPatients();

    updateProviderStats();

    renderPatientDirectory();

    renderReports();

    renderPrescriptions();

    if (selectedPatient) {

        const updated =
            patients.find(
                patient =>
                    String(patient.id) ===
                    String(selectedPatient.id)
            );

        if (updated) {
            selectedPatient = updated;
            renderSelectedPatientRecords();
        }

    }

});


/* =========================================================
   EXPOSE SOME FUNCTIONS
   ========================================================= */

window.showProviderSection =
    showProviderSection;

window.selectPatient =
    selectPatient;

window.openRecordModal =
    openRecordModal;

window.openPrescriptionModal =
    openPrescriptionModal;