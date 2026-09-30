/* =========================================================
   HEALTH RECORD SYSTEM
   PATIENT DASHBOARD JAVASCRIPT
   ========================================================= */

const USERS_KEY = "hrs_users";
const CURRENT_USER_KEY = "hrs_current_user";

let currentUser = null;
let selectedRecordType = "General Checkup";
let selectedRecordFile = null;


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
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


function setCurrentUser(user) {
    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(user)
    );
}


function updateStoredUser(updatedUser) {

    const users = getUsers();

    const index = users.findIndex(
        user => user.id === updatedUser.id
    );

    if (index !== -1) {

        users[index] = updatedUser;

        saveUsers(users);

        setCurrentUser(updatedUser);
    }
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
        return "P";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("");
}


function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
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

    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatFileSize(bytes) {

    if (!bytes) {
        return "0 KB";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

    const toast = document.getElementById("toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;

    toast.style.display = "block";

    clearTimeout(
        window.toastTimer
    );

    window.toastTimer = setTimeout(() => {

        toast.style.display = "none";

    }, 2800);
}


/* =========================================================
   PAGE ACCESS
   ========================================================= */

function checkPatientAccess() {

    currentUser = getCurrentUser();

    if (!currentUser) {

        window.location.href = "index.html";

        return false;
    }

    if (currentUser.role !== "patient") {

        window.location.href =
            "doctor-dashboard.html";

        return false;
    }

    return true;
}


/* =========================================================
   INITIALIZE USER ARRAYS
   ========================================================= */

function initializeUserArrays() {

    if (!Array.isArray(currentUser.records)) {
        currentUser.records = [];
    }

    if (!Array.isArray(currentUser.reports)) {
        currentUser.reports = [];
    }

    if (!Array.isArray(currentUser.prescriptions)) {
        currentUser.prescriptions = [];
    }
}


/* =========================================================
   LOAD PATIENT INFORMATION
   ========================================================= */

function loadPatientInformation() {

    const name =
        currentUser.name || "Patient";

    const initials =
        getInitials(name);


    const sidebarName =
        document.getElementById("sidebarName");

    const sidebarAvatar =
        document.getElementById("sidebarAvatar");

    const headerName =
        document.getElementById("headerName");

    const headerAvatar =
        document.getElementById("headerAvatar");


    if (sidebarName) {
        sidebarName.textContent = name;
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
    }

    if (headerName) {
        headerName.textContent = name;
    }

    if (headerAvatar) {
        headerAvatar.textContent = initials;
    }


    /* PROFILE */

    const profileAvatar =
        document.getElementById("profileAvatar");

    const profileName =
        document.getElementById("profileName");

    const profileFullName =
        document.getElementById("profileFullName");

    const profileDOB =
        document.getElementById("profileDOB");

    const profileGender =
        document.getElementById("profileGender");

    const profilePhone =
        document.getElementById("profilePhone");

    const profileEmail =
        document.getElementById("profileEmail");


    if (profileAvatar) {
        profileAvatar.textContent = initials;
    }

    if (profileName) {
        profileName.textContent = name;
    }

    if (profileFullName) {
        profileFullName.textContent =
            currentUser.name || "—";
    }

    if (profileDOB) {
        profileDOB.textContent =
            formatDate(currentUser.dob);
    }

    if (profileGender) {
        profileGender.textContent =
            currentUser.gender || "—";
    }

    if (profilePhone) {
        profilePhone.textContent =
            currentUser.phone || "—";
    }

    if (profileEmail) {
        profileEmail.textContent =
            currentUser.email || "Not provided";
    }
}


/* =========================================================
   SECTION NAVIGATION
   ========================================================= */

function showSection(sectionId) {

    document
        .querySelectorAll(".dashboard-section")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.getElementById(sectionId);

    if (target) {
        target.classList.add("active");
    }


    document
        .querySelectorAll(".nav-item[data-section]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });


    if (sectionId === "overview") {
        renderRecentRecords();
    }

    if (sectionId === "history") {
        renderAllRecords();
    }

    if (sectionId === "reports") {
        renderReports();
    }

    if (sectionId === "prescriptions") {
        renderPrescriptions();
    }
}


/* =========================================================
   NAVIGATION EVENTS
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-item[data-section]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.section
                    );

                }
            );

        });


    document
        .querySelectorAll("[data-section-target]")
        .forEach(element => {

            element.addEventListener(
                "click",
                () => {

                    showSection(
                        element.dataset.sectionTarget
                    );

                }
            );

        });
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    const recordCount =
        document.getElementById("recordCount");

    const reportCount =
        document.getElementById("reportCount");

    const prescriptionCount =
        document.getElementById(
            "prescriptionCount"
        );

    const healthStatus =
        document.getElementById("healthStatus");


    const records =
        currentUser.records || [];

    const reports =
        currentUser.reports || [];

    const prescriptions =
        currentUser.prescriptions || [];


    if (recordCount) {
        recordCount.textContent =
            records.length;
    }

    if (reportCount) {
        reportCount.textContent =
            reports.length;
    }

    if (prescriptionCount) {
        prescriptionCount.textContent =
            prescriptions.length;
    }


    if (healthStatus) {

        if (records.length === 0) {

            healthStatus.textContent =
                "No data";

        } else {

            healthStatus.textContent =
                "Active";
        }
    }
}


/* =========================================================
   RECORD TYPE ICON
   ========================================================= */

function getRecordIcon(type) {

    const icons = {

        "General Checkup": "🩺",

        "Cardiology": "❤️",

        "Blood Test": "🩸",

        "ECG": "💓",

        "X-Ray": "🩻",

        "MRI": "🧠",

        "CT Scan": "🔬",

        "Respiratory": "🫁",

        "Orthopedic": "🦴",

        "Neurology": "🧠",

        "Dental": "🦷",

        "Eye": "👁️",

        "Prescription": "💊",

        "Lab Report": "🧪",

        "Other": "📄"

    };


    return icons[type] || "📄";
}


/* =========================================================
   RECORD TYPE CARDS
   ========================================================= */

function setupRecordTypeCards() {

    document
        .querySelectorAll(".record-type-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const type =
                        card.dataset.recordType ||
                        "General Checkup";


                    selectedRecordType = type;


                    const recordType =
                        document.getElementById(
                            "recordType"
                        );

                    if (recordType) {
                        recordType.value = type;
                    }


                    openRecordModal();

                }
            );

        });
}


/* =========================================================
   RECORD MODAL
   ========================================================= */

function openRecordModal(type = null) {

    const modal =
        document.getElementById("recordModal");

    if (!modal) {
        return;
    }


    if (type) {

        selectedRecordType = type;

        const recordType =
            document.getElementById("recordType");

        if (recordType) {
            recordType.value = type;
        }
    }


    const recordDate =
        document.getElementById("recordDate");

    if (recordDate && !recordDate.value) {
        recordDate.value = getToday();
    }


    modal.classList.add("active");

    document.body.style.overflow = "hidden";
}


function closeRecordModal() {

    const modal =
        document.getElementById("recordModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    document.body.style.overflow = "";

    resetRecordForm();
}


function resetRecordForm() {

    const form =
        document.getElementById("recordForm");

    if (form) {
        form.reset();
    }


    selectedRecordFile = null;


    const recordDate =
        document.getElementById("recordDate");

    if (recordDate) {
        recordDate.value = getToday();
    }


    const recordFilePreview =
        document.getElementById(
            "recordFilePreview"
        );

    if (recordFilePreview) {
        recordFilePreview.style.display =
            "none";
    }


    const recordFile =
        document.getElementById("recordFile");

    if (recordFile) {
        recordFile.value = "";
    }


    const recordFileName =
        document.getElementById(
            "recordFileName"
        );

    const recordFileSize =
        document.getElementById(
            "recordFileSize"
        );


    if (recordFileName) {
        recordFileName.textContent = "File";
    }

    if (recordFileSize) {
        recordFileSize.textContent = "0 KB";
    }
}


/* =========================================================
   FILE -> DATA URL
   ========================================================= */

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
                        "Unable to read file."
                    )
                );

            };


            reader.readAsDataURL(file);

        }
    );
}


/* =========================================================
   MEDICAL FILE VALIDATION
   ========================================================= */

function isAllowedMedicalFile(file) {

    if (!file) {
        return false;
    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"

    ];


    return allowedTypes.includes(
        file.type
    );
}


/* =========================================================
   FILE UPLOAD PREVIEW
   ========================================================= */

function setupRecordFileUpload() {

    const fileInput =
        document.getElementById(
            "recordFile"
        );


    if (!fileInput) {
        return;
    }


    fileInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files[0];


            if (!file) {
                return;
            }


            if (!isAllowedMedicalFile(file)) {

                showToast(
                    "Please select JPG, PNG, WEBP or PDF."
                );

                fileInput.value = "";

                return;
            }


            /*
             * Local Storage has limited space.
             * Keep demo uploads reasonably small.
             */

            const maxSize =
                3 * 1024 * 1024;


            if (file.size > maxSize) {

                showToast(
                    "For this prototype, please use a file below 3 MB."
                );

                fileInput.value = "";

                return;
            }


            try {

                selectedRecordFile = {

                    name: file.name,

                    type: file.type,

                    size: file.size,

                    data: await fileToDataURL(
                        file
                    )

                };


                showRecordFilePreview(
                    selectedRecordFile
                );


            } catch (error) {

                selectedRecordFile = null;

                fileInput.value = "";

                showToast(
                    "Could not read the selected file."
                );
            }

        }
    );
}


/* =========================================================
   SHOW FILE PREVIEW
   ========================================================= */

function showRecordFilePreview(file) {

    const preview =
        document.getElementById(
            "recordFilePreview"
        );

    const nameElement =
        document.getElementById(
            "recordFileName"
        );

    const sizeElement =
        document.getElementById(
            "recordFileSize"
        );

    const iconElement =
        document.getElementById(
            "recordFilePreviewIcon"
        );


    if (!preview) {
        return;
    }


    preview.style.display =
        "flex";


    if (nameElement) {

        nameElement.textContent =
            file.name;
    }


    if (sizeElement) {

        sizeElement.textContent =
            formatFileSize(file.size);
    }


    if (iconElement) {

        if (
            file.type ===
            "application/pdf"
        ) {

            iconElement.textContent =
                "📕";

        } else {

            iconElement.textContent =
                "🖼️";
        }
    }


    /* Image preview */

    const oldPreview =
        document.getElementById(
            "recordImagePreview"
        );

    if (oldPreview) {
        oldPreview.remove();
    }


    if (
        file.type.startsWith("image/")
    ) {

        const image =
            document.createElement("img");


        image.id =
            "recordImagePreview";


        image.src =
            file.data;


        image.alt =
            "Medical file preview";


        image.style.width =
            "100%";


        image.style.maxHeight =
            "180px";


        image.style.objectFit =
            "contain";


        image.style.marginTop =
            "12px";


        image.style.borderRadius =
            "12px";


        image.style.background =
            "#f3f9fc";


        preview.parentElement.appendChild(
            image
        );
    }
}


/* =========================================================
   REMOVE SELECTED FILE
   ========================================================= */

function removeSelectedRecordFile() {

    selectedRecordFile = null;


    const fileInput =
        document.getElementById(
            "recordFile"
        );

    if (fileInput) {
        fileInput.value = "";
    }


    const preview =
        document.getElementById(
            "recordFilePreview"
        );

    if (preview) {
        preview.style.display =
            "none";
    }


    const imagePreview =
        document.getElementById(
            "recordImagePreview"
        );

    if (imagePreview) {
        imagePreview.remove();
    }


    showToast(
        "File removed."
    );
}


/* =========================================================
   SAVE MEDICAL RECORD
   ========================================================= */

async function saveMedicalRecord(
    event
) {

    event.preventDefault();


    const date =
        document.getElementById(
            "recordDate"
        )?.value;


    const type =
        document.getElementById(
            "recordType"
        )?.value ||
        "General Checkup";


    const doctor =
        document.getElementById(
            "recordDoctor"
        )?.value.trim() || "";


    const hospital =
        document.getElementById(
            "recordHospital"
        )?.value.trim() || "";


    const notes =
        document.getElementById(
            "recordNotes"
        )?.value.trim() || "";


    const conclusion =
        document.getElementById(
            "recordConclusion"
        )?.value.trim() || "";


    if (!date) {

        showToast(
            "Please select the record date."
        );

        return;
    }


    /*
     * Create medical record
     */

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

        file: selectedRecordFile
            ? {
                name:
                    selectedRecordFile.name,

                type:
                    selectedRecordFile.type,

                size:
                    selectedRecordFile.size,

                data:
                    selectedRecordFile.data
            }
            : null,

        createdAt:
            new Date().toISOString(),

        source:
            "patient"

    };


    /*
     * Save record
     */

    currentUser.records.unshift(
        record
    );


    /*
     * If record is a prescription,
     * also keep it in prescriptions.
     */

    if (
        type === "Prescription"
    ) {

        currentUser.prescriptions.unshift({

            id: record.id,

            date: record.date,

            doctor: record.doctor,

            hospital: record.hospital,

            notes: record.notes,

            conclusion:
                record.conclusion,

            file:
                record.file,

            createdAt:
                record.createdAt,

            source:
                "patient"

        });

    }


    /*
     * If the record contains a file
     * and represents a report,
     * also add metadata to reports.
     */

    const reportTypes = [

        "Blood Test",
        "ECG",
        "X-Ray",
        "MRI",
        "CT Scan",
        "Lab Report",
        "Respiratory",
        "Orthopedic",
        "Neurology",
        "Dental",
        "Eye",
        "Other"

    ];


    if (
        record.file &&
        reportTypes.includes(type)
    ) {

        currentUser.reports.unshift({

            id:
                record.id,

            name:
                record.file.name,

            date:
                record.date,

            type,

            file:
                record.file,

            conclusion:
                record.conclusion,

            createdAt:
                record.createdAt,

            source:
                "patient"

        });

    }


    /*
     * Save everything
     */

    try {

        updateStoredUser(
            currentUser
        );

    } catch (error) {

        showToast(
            "Storage limit reached. Try a smaller file."
        );

        /*
         * Roll back record if storage failed.
         */

        currentUser.records =
            currentUser.records.filter(
                item =>
                    item.id !== record.id
            );

        currentUser.prescriptions =
            currentUser.prescriptions.filter(
                item =>
                    item.id !== record.id
            );

        currentUser.reports =
            currentUser.reports.filter(
                item =>
                    item.id !== record.id
            );

        return;
    }


    updateStatistics();

    renderRecentRecords();

    renderAllRecords();

    renderReports();

    renderPrescriptions();


    closeRecordModal();


    showToast(
        "Medical record saved successfully."
    );


    showSection(
        "history"
    );
}


/* =========================================================
   RECORD CARD
   ========================================================= */

function createRecordCard(record) {

    const icon =
        getRecordIcon(
            record.type
        );


    const fileHTML =
        record.file
            ? `
                <div
                    class="record-file-badge"
                    style="
                        margin-top:12px;
                        padding:10px;
                        border-radius:10px;
                        background:#edf9fd;
                        color:#26708b;
                        font-size:10px;
                    "
                >
                    📎 ${escapeHTML(record.file.name)}
                    <span>
                        (${escapeHTML(
                            formatFileSize(
                                record.file.size
                            )
                        )})
                    </span>
                </div>
            `
            : "";


    return `

        <article class="medical-record-card">

            <div
                class="record-card-header"
            >

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                    "
                >

                    <span
                        style="
                            font-size:20px;
                        "
                    >
                        ${icon}
                    </span>

                    <div>

                        <div
                            class="record-card-title"
                        >
                            ${escapeHTML(
                                record.type
                            )}
                        </div>

                        <div
                            style="
                                color:#91a5af;
                                font-size:8px;
                                margin-top:3px;
                            "
                        >
                            ${escapeHTML(
                                formatDate(
                                    record.date
                                )
                            )}
                        </div>

                    </div>

                </div>


                <span
                    class="record-card-date"
                >
                    ${escapeHTML(
                        record.source ===
                        "provider"
                            ? "Provider"
                            : "Patient"
                    )}
                </span>

            </div>


            ${
                record.doctor
                    ? `
                        <div
                            style="
                                margin-top:12px;
                                color:#547384;
                                font-size:10px;
                            "
                        >
                            <strong>
                                Doctor:
                            </strong>
                            ${escapeHTML(
                                record.doctor
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                record.hospital
                    ? `
                        <div
                            style="
                                margin-top:5px;
                                color:#547384;
                                font-size:10px;
                            "
                        >
                            <strong>
                                Hospital:
                            </strong>
                            ${escapeHTML(
                                record.hospital
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                record.notes
                    ? `
                        <div
                            class="record-card-body"
                        >
                            <strong>
                                Medical Notes:
                            </strong>
                            ${escapeHTML(
                                record.notes
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                record.conclusion
                    ? `
                        <div
                            class="record-card-body"
                        >
                            <strong>
                                Conclusion / Findings:
                            </strong>
                            ${escapeHTML(
                                record.conclusion
                            )}
                        </div>
                    `
                    : ""
            }


            ${fileHTML}

        </article>

    `;
}


/* =========================================================
   RECENT RECORDS
   ========================================================= */

function renderRecentRecords() {

    const container =
        document.getElementById(
            "recentRecords"
        );


    if (!container) {
        return;
    }


    const records =
        currentUser.records || [];


    if (records.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div
                    class="empty-state-icon"
                >
                    📋
                </div>

                <h3>
                    No medical records yet
                </h3>

                <p>
                    Add your first health record
                    to keep your medical history
                    organized in one place.
                </p>

                <button
                    type="button"
                    id="emptyAddRecordBtn"
                >
                    + Add Health Record
                </button>

            </div>

        `;


        const button =
            document.getElementById(
                "emptyAddRecordBtn"
            );


        if (button) {

            button.addEventListener(
                "click",
                () => {

                    openRecordModal();

                }
            );
        }


        return;
    }


    const recent =
        records.slice(0, 4);


    container.innerHTML =
        recent
            .map(createRecordCard)
            .join("");
}


/* =========================================================
   ALL RECORDS
   ========================================================= */

function renderAllRecords() {

    const container =
        document.getElementById(
            "allRecords"
        );


    if (!container) {
        return;
    }


    const records =
        currentUser.records || [];


    if (records.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div
                    class="empty-state-icon"
                >
                    📋
                </div>

                <h3>
                    No medical records
                </h3>

                <p>
                    Your saved visits, tests,
                    examinations and other
                    medical records will appear here.
                </p>

                <button
                    type="button"
                    id="historyEmptyAddBtn"
                >
                    + Add Medical Record
                </button>

            </div>

        `;


        const button =
            document.getElementById(
                "historyEmptyAddBtn"
            );


        if (button) {

            button.addEventListener(
                "click",
                openRecordModal
            );
        }


        return;
    }


    container.innerHTML =
        records
            .map(createRecordCard)
            .join("");
}


/* =========================================================
   REPORT MODAL
   ========================================================= */

function openReportModal() {

    const modal =
        document.getElementById(
            "reportModal"
        );


    if (!modal) {
        return;
    }


    const reportDate =
        document.getElementById(
            "reportDate"
        );


    if (
        reportDate &&
        !reportDate.value
    ) {

        reportDate.value =
            getToday();
    }


    modal.classList.add("active");

    document.body.style.overflow =
        "hidden";
}


function closeReportModal() {

    const modal =
        document.getElementById(
            "reportModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";


    const form =
        document.getElementById(
            "reportForm"
        );


    if (form) {
        form.reset();
    }
}


/* =========================================================
   SAVE REPORT
   ========================================================= */

async function saveReport(event) {

    event.preventDefault();


    const name =
        document.getElementById(
            "reportName"
        )?.value.trim();


    const date =
        document.getElementById(
            "reportDate"
        )?.value;


    const type =
        document.getElementById(
            "reportType"
        )?.value ||
        "Other";


    const fileInput =
        document.getElementById(
            "reportFile"
        );


    const conclusion =
        document.getElementById(
            "reportConclusion"
        )?.value.trim() || "";


    if (!fileInput?.files?.length) {

        showToast(
            "Please select a medical report."
        );

        return;
    }


    const file =
        fileInput.files[0];


    if (!isAllowedMedicalFile(file)) {

        showToast(
            "Please select JPG, PNG, WEBP or PDF."
        );

        return;
    }


    if (
        file.size >
        3 * 1024 * 1024
    ) {

        showToast(
            "Please use a file below 3 MB."
        );

        return;
    }


    try {

        const fileData =
            await fileToDataURL(
                file
            );


        const report = {

            id:
                "REP-" +
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .slice(2, 7),

            name:
                name ||
                file.name,

            date,

            type,

            file: {

                name:
                    file.name,

                type:
                    file.type,

                size:
                    file.size,

                data:
                    fileData

            },

            conclusion,

            createdAt:
                new Date().toISOString(),

            source:
                "patient"

        };


        currentUser.reports.unshift(
            report
        );


        /*
         * Prescription reports also go
         * to prescriptions.
         */

        if (
            type ===
            "Prescription"
        ) {

            currentUser.prescriptions.unshift({

                id:
                    report.id,

                date:
                    report.date,

                doctor: "",

                hospital: "",

                notes:
                    report.name,

                conclusion:
                    report.conclusion,

                file:
                    report.file,

                createdAt:
                    report.createdAt,

                source:
                    "patient"

            });
        }


        try {

            updateStoredUser(
                currentUser
            );

        } catch (storageError) {

            currentUser.reports =
                currentUser.reports.filter(
                    item =>
                        item.id !==
                        report.id
                );

            currentUser.prescriptions =
                currentUser.prescriptions.filter(
                    item =>
                        item.id !==
                        report.id
                );

            showToast(
                "Storage limit reached. Try a smaller file."
            );

            return;
        }


        updateStatistics();

        renderReports();

        renderPrescriptions();


        closeReportModal();


        showToast(
            "Medical report uploaded successfully."
        );


        showSection(
            "reports"
        );


    } catch (error) {

        showToast(
            "Unable to save the report."
        );
    }
}


/* =========================================================
   REPORT CARD
   ========================================================= */

function createReportCard(report) {

    const file =
        report.file;


    return `

        <article
            class="report-card"
            style="
                display:flex;
                gap:15px;
                align-items:flex-start;
            "
        >

            <div
                style="
                    width:45px;
                    height:45px;
                    flex-shrink:0;
                    border-radius:13px;
                    background:#e8f8fd;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:20px;
                "
            >
                ${
                    file?.type ===
                    "application/pdf"
                        ? "📕"
                        : "🖼️"
                }
            </div>


            <div style="flex:1;">

                <h3>
                    ${escapeHTML(
                        report.name ||
                        file?.name ||
                        "Medical Report"
                    )}
                </h3>


                <p>
                    ${escapeHTML(
                        report.type
                    )}
                    ·
                    ${escapeHTML(
                        formatDate(
                            report.date
                        )
                    )}
                </p>


                ${
                    file
                        ? `
                            <p
                                style="
                                    margin-top:7px;
                                    color:#5f8191;
                                "
                            >
                                📎
                                ${escapeHTML(
                                    file.name
                                )}
                                ·
                                ${escapeHTML(
                                    formatFileSize(
                                        file.size
                                    )
                                )}
                            </p>
                        `
                        : ""
                }


                ${
                    report.conclusion
                        ? `
                            <p
                                style="
                                    margin-top:8px;
                                    line-height:1.5;
                                "
                            >
                                <strong>
                                    Findings:
                                </strong>
                                ${escapeHTML(
                                    report.conclusion
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

        </article>

    `;
}


/* =========================================================
   RENDER REPORTS
   ========================================================= */

function renderReports() {

    const container =
        document.getElementById(
            "reportsList"
        );


    if (!container) {
        return;
    }


    const reports =
        currentUser.reports || [];


    if (reports.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div
                    class="empty-state-icon"
                >
                    📄
                </div>

                <h3>
                    No reports uploaded
                </h3>

                <p>
                    Upload ECG, X-Ray, MRI,
                    blood test, CT scan,
                    prescription or other
                    medical documents.
                </p>

                <button
                    type="button"
                    id="reportsEmptyBtn"
                >
                    + Upload Medical Report
                </button>

            </div>

        `;


        const button =
            document.getElementById(
                "reportsEmptyBtn"
            );


        if (button) {

            button.addEventListener(
                "click",
                openReportModal
            );
        }


        return;
    }


    container.innerHTML = `

        <div
            class="reports-grid"
        >

            ${
                reports
                    .map(
                        createReportCard
                    )
                    .join("")
            }

        </div>

    `;
}


/* =========================================================
   PRESCRIPTIONS
   ========================================================= */

function createPrescriptionCard(
    prescription
) {

    return `

        <article
            class="prescription-card"
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                "
            >

                <div
                    style="
                        width:45px;
                        height:45px;
                        border-radius:13px;
                        background:#fff1f7;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:20px;
                    "
                >
                    💊
                </div>


                <div>

                    <h3>
                        Prescription
                    </h3>

                    <p>
                        ${escapeHTML(
                            formatDate(
                                prescription.date
                            )
                        )}
                    </p>

                </div>

            </div>


            ${
                prescription.doctor
                    ? `
                        <p
                            style="
                                margin-top:12px;
                            "
                        >
                            <strong>
                                Doctor:
                            </strong>
                            ${escapeHTML(
                                prescription.doctor
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                prescription.hospital
                    ? `
                        <p
                            style="
                                margin-top:5px;
                            "
                        >
                            <strong>
                                Hospital:
                            </strong>
                            ${escapeHTML(
                                prescription.hospital
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                prescription.notes
                    ? `
                        <p
                            style="
                                margin-top:9px;
                                line-height:1.5;
                            "
                        >
                            ${escapeHTML(
                                prescription.notes
                            )}
                        </p>
                    `
                    : ""
            }


            ${
                prescription.file
                    ? `
                        <p
                            style="
                                margin-top:9px;
                                color:#4d8297;
                            "
                        >
                            📎
                            ${escapeHTML(
                                prescription.file.name
                            )}
                        </p>
                    `
                    : ""
            }

        </article>

    `;
}


function renderPrescriptions() {

    const container =
        document.getElementById(
            "prescriptionsList"
        );


    if (!container) {
        return;
    }


    const prescriptions =
        currentUser.prescriptions || [];


    if (
        prescriptions.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div
                    class="empty-state-icon"
                >
                    💊
                </div>

                <h3>
                    No prescriptions yet
                </h3>

                <p>
                    Prescriptions added by you
                    or your healthcare provider
                    will appear here.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML = `

        <div
            class="prescriptions-grid"
        >

            ${
                prescriptions
                    .map(
                        createPrescriptionCard
                    )
                    .join("")
            }

        </div>

    `;
}


/* =========================================================
   EDIT PROFILE
   ========================================================= */

function openProfileModal() {

    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (!modal) {
        return;
    }


    document.getElementById(
        "editName"
    ).value =
        currentUser.name || "";


    document.getElementById(
        "editDOB"
    ).value =
        currentUser.dob || "";


    document.getElementById(
        "editPhone"
    ).value =
        currentUser.phone || "";


    document.getElementById(
        "editGender"
    ).value =
        currentUser.gender || "Other";


    document.getElementById(
        "editEmail"
    ).value =
        currentUser.email || "";


    modal.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";
}


function closeProfileModal() {

    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";
}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

function saveProfile(event) {

    event.preventDefault();


    currentUser.name =
        document.getElementById(
            "editName"
        ).value.trim();


    currentUser.dob =
        document.getElementById(
            "editDOB"
        ).value;


    currentUser.phone =
        document.getElementById(
            "editPhone"
        ).value.trim();


    currentUser.gender =
        document.getElementById(
            "editGender"
        ).value;


    currentUser.email =
        document.getElementById(
            "editEmail"
        ).value.trim();


    updateStoredUser(
        currentUser
    );


    loadPatientInformation();

    closeProfileModal();


    showToast(
        "Profile updated successfully."
    );
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

    window.location.href =
        "index.html";
}


/* =========================================================
   SETUP BUTTONS
   ========================================================= */

function setupButtons() {


    /* HOME ADD RECORD */

    const homeAddRecord =
        document.getElementById(
            "homeAddRecordBtn"
        );


    if (homeAddRecord) {

        homeAddRecord.addEventListener(
            "click",
            openRecordModal
        );
    }


    /* HOME UPLOAD REPORT */

    const homeAddReport =
        document.getElementById(
            "homeAddReportBtn"
        );


    if (homeAddReport) {

        homeAddReport.addEventListener(
            "click",
            openReportModal
        );
    }


    /* HISTORY ADD */

    const historyAdd =
        document.getElementById(
            "historyAddRecordBtn"
        );


    if (historyAdd) {

        historyAdd.addEventListener(
            "click",
            openRecordModal
        );
    }


    /* RECORD MODAL CLOSE */

    const closeRecord =
        document.getElementById(
            "closeRecordModal"
        );


    const cancelRecord =
        document.getElementById(
            "cancelRecordBtn"
        );


    if (closeRecord) {

        closeRecord.addEventListener(
            "click",
            closeRecordModal
        );
    }


    if (cancelRecord) {

        cancelRecord.addEventListener(
            "click",
            closeRecordModal
        );
    }


    /* REPORT MODAL */

    const reportAdd =
        document.getElementById(
            "reportsAddBtn"
        );


    if (reportAdd) {

        reportAdd.addEventListener(
            "click",
            openReportModal
        );
    }


    const closeReport =
        document.getElementById(
            "closeReportModal"
        );


    const cancelReport =
        document.getElementById(
            "cancelReportBtn"
        );


    if (closeReport) {

        closeReport.addEventListener(
            "click",
            closeReportModal
        );
    }


    if (cancelReport) {

        cancelReport.addEventListener(
            "click",
            closeReportModal
        );
    }


    /* FILE REMOVE */

    const removeFile =
        document.getElementById(
            "removeRecordFile"
        );


    if (removeFile) {

        removeFile.addEventListener(
            "click",
            removeSelectedRecordFile
        );
    }


    /* RECORD FORM */

    const recordForm =
        document.getElementById(
            "recordForm"
        );


    if (recordForm) {

        recordForm.addEventListener(
            "submit",
            saveMedicalRecord
        );
    }


    /* REPORT FORM */

    const reportForm =
        document.getElementById(
            "reportForm"
        );


    if (reportForm) {

        reportForm.addEventListener(
            "submit",
            saveReport
        );
    }


    /* PROFILE */

    const editProfile =
        document.getElementById(
            "editProfileBtn"
        );


    if (editProfile) {

        editProfile.addEventListener(
            "click",
            openProfileModal
        );
    }


    const closeProfile =
        document.getElementById(
            "closeProfileModal"
        );


    const cancelProfile =
        document.getElementById(
            "cancelProfileBtn"
        );


    if (closeProfile) {

        closeProfile.addEventListener(
            "click",
            closeProfileModal
        );
    }


    if (cancelProfile) {

        cancelProfile.addEventListener(
            "click",
            closeProfileModal
        );
    }


    const editProfileForm =
        document.getElementById(
            "editProfileForm"
        );


    if (editProfileForm) {

        editProfileForm.addEventListener(
            "submit",
            saveProfile
        );
    }


    /* LOGOUT */

    const logout =
        document.getElementById(
            "logoutBtn"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            logoutUser
        );
    }
}


/* =========================================================
   OUTSIDE CLICK / ESCAPE
   ========================================================= */

function setupModalBehaviour() {

    document
        .querySelectorAll(".modal-overlay")
        .forEach(modal => {


            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        modal.classList.remove(
                            "active"
                        );

                        document.body.style.overflow =
                            "";
                    }

                }
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal-overlay.active"
                    )
                    .forEach(modal => {

                        modal.classList.remove(
                            "active"
                        );

                    });

                document.body.style.overflow =
                    "";
            }

        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (!checkPatientAccess()) {
            return;
        }


        initializeUserArrays();


        /*
         * Save normalized arrays back
         * to current user.
         */

        updateStoredUser(
            currentUser
        );


        loadPatientInformation();

        updateStatistics();

        renderRecentRecords();

        renderAllRecords();

        renderReports();

        renderPrescriptions();

        setupNavigation();

        setupRecordTypeCards();

        setupRecordFileUpload();

        setupButtons();

        setupModalBehaviour();


        /*
         * Default date
         */

        const recordDate =
            document.getElementById(
                "recordDate"
            );


        if (recordDate) {
            recordDate.value =
                getToday();
        }


        const reportDate =
            document.getElementById(
                "reportDate"
            );


        if (reportDate) {
            reportDate.value =
                getToday();
        }

    }
);