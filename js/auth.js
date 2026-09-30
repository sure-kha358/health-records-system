/* =========================================================
   HEALTH RECORD SYSTEM
   AUTHENTICATION SYSTEM
   Patient Signup/Login + Healthcare Provider Login
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const USERS_KEY = "hrs_users";
const CURRENT_USER_KEY = "hrs_current_user";


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function getUsers() {

    try {

        const users =
            JSON.parse(
                localStorage.getItem(USERS_KEY)
            );

        return Array.isArray(users)
            ? users
            : [];

    } catch (error) {

        console.error(
            "Unable to read users:",
            error
        );

        return [];
    }
}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


function setCurrentUser(user) {

    localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify(user)
    );
}


function getCurrentUser() {

    try {

        return JSON.parse(
            localStorage.getItem(
                CURRENT_USER_KEY
            )
        );

    } catch (error) {

        return null;
    }
}


function clearCurrentUser() {

    localStorage.removeItem(
        CURRENT_USER_KEY
    );
}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function normalize(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function normalizePhone(value) {

    return String(value || "")
        .replace(/\D/g, "");
}


function showAuthMessage(message, type = "error") {

    const messageBox =
        document.getElementById("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;

    messageBox.className =
        "auth-message show " + type;

}


function hideAuthMessage() {

    const messageBox =
        document.getElementById("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = "";

    messageBox.className =
        "auth-message";

}


/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function togglePassword(inputId, button) {

    const input =
        document.getElementById(inputId);

    if (!input) {
        return;
    }


    if (input.type === "password") {

        input.type = "text";

        if (button) {
            button.textContent = "🙈";
        }

    } else {

        input.type = "password";

        if (button) {
            button.textContent = "👁";
        }

    }

}


/* Make function available to HTML onclick */
window.togglePassword = togglePassword;


/* =========================================================
   ROLE SWITCH
   ========================================================= */

let selectedRole = "patient";


function setupRoleButtons() {

    const roleButtons =
        document.querySelectorAll(
            ".role-btn"
        );


    roleButtons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                roleButtons.forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });


                this.classList.add(
                    "active"
                );


                selectedRole =
                    this.dataset.role ||
                    "patient";


                updateProviderHint();

            }
        );

    });

}


function updateProviderHint() {

    const hint =
        document.getElementById(
            "providerHint"
        );

    if (!hint) {
        return;
    }


    if (selectedRole === "provider") {

        hint.style.display = "flex";

    } else {

        hint.style.display = "none";

    }

}


/* =========================================================
   PATIENT SIGNUP
   ========================================================= */

function setupSignup() {

    const signupForm =
        document.getElementById(
            "signupForm"
        );


    if (!signupForm) {
        return;
    }


    signupForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            hideAuthMessage();


            /* -----------------------------------------
               GET VALUES
               ----------------------------------------- */

            const name =
                document
                    .getElementById("signupName")
                    .value
                    .trim();


            const dob =
                document
                    .getElementById("signupDOB")
                    .value;


            const phone =
                document
                    .getElementById("signupPhone")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("signupEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("signupPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById(
                        "signupConfirmPassword"
                    )
                    .value;


            const terms =
                document.getElementById(
                    "termsCheck"
                );


            const genderElement =
                document.querySelector(
                    'input[name="gender"]:checked'
                );


            const gender =
                genderElement
                    ? genderElement.value
                    : "";


            /* -----------------------------------------
               VALIDATION
               ----------------------------------------- */

            if (!name) {

                showAuthMessage(
                    "Please enter your full name."
                );

                return;
            }


            if (!dob) {

                showAuthMessage(
                    "Please enter your date of birth."
                );

                return;
            }


            if (!gender) {

                showAuthMessage(
                    "Please select your gender."
                );

                return;
            }


            const cleanPhone =
                normalizePhone(phone);


            if (cleanPhone.length < 10) {

                showAuthMessage(
                    "Please enter a valid phone number."
                );

                return;
            }


            if (
                email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(email)
            ) {

                showAuthMessage(
                    "Please enter a valid email address."
                );

                return;
            }


            if (password.length < 6) {

                showAuthMessage(
                    "Password must contain at least 6 characters."
                );

                return;
            }


            if (password !== confirmPassword) {

                showAuthMessage(
                    "Passwords do not match."
                );

                return;
            }


            if (!terms || !terms.checked) {

                showAuthMessage(
                    "Please accept the academic prototype terms."
                );

                return;
            }


            /* -----------------------------------------
               EXISTING USERS
               ----------------------------------------- */

            const users =
                getUsers();


            const phoneExists =
                users.some(user =>
                    normalizePhone(user.phone) ===
                    cleanPhone
                );


            if (phoneExists) {

                showAuthMessage(
                    "An account with this phone number already exists. Please login."
                );

                return;
            }


            if (email) {

                const emailExists =
                    users.some(user =>
                        normalize(user.email) ===
                        normalize(email)
                    );


                if (emailExists) {

                    showAuthMessage(
                        "An account with this email already exists. Please login."
                    );

                    return;
                }

            }


            /* -----------------------------------------
               CREATE PATIENT
               ----------------------------------------- */

            const newUser = {

                id:
                    "PAT-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .substring(2, 7),


                role: "patient",


                name: name,


                dob: dob,


                gender: gender,


                phone: cleanPhone,


                email: email || "",


                password: password,


                createdAt:
                    new Date().toISOString(),


                records: [],


                reports: [],


                prescriptions: []

            };


            users.push(newUser);

            saveUsers(users);


            /* -----------------------------------------
               SET CURRENT USER
               ----------------------------------------- */

            setCurrentUser(
                newUser
            );


            showAuthMessage(
                "Account created successfully! Opening your dashboard...",
                "success"
            );


            /* -----------------------------------------
               REDIRECT
               ----------------------------------------- */

            setTimeout(
                function () {

                    window.location.href =
                        "dashboard.html";

                },
                900
            );

        }
    );

}


/* =========================================================
   LOGIN
   ========================================================= */

function setupLogin() {

    const loginForm =
        document.getElementById(
            "loginForm"
        );


    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            hideAuthMessage();


            const identifier =
                document
                    .getElementById(
                        "loginIdentifier"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "loginPassword"
                    )
                    .value;


            if (!identifier || !password) {

                showAuthMessage(
                    "Please enter your email/phone and password."
                );

                return;
            }


            /* =========================================
               HEALTHCARE PROVIDER
               ========================================= */

            if (selectedRole === "provider") {


                const providerEmail =
                    "doctor@hrs.com";


                const providerPassword =
                    "doctor123";


                if (
                    normalize(identifier) ===
                    providerEmail &&
                    password ===
                    providerPassword
                ) {


                    const providerUser = {

                        id: "PROVIDER-001",

                        role: "provider",

                        name: "Healthcare Provider",

                        email: providerEmail,

                        phone: "",

                        dob: "",

                        gender: "",

                        records: [],

                        reports: [],

                        prescriptions: []

                    };


                    setCurrentUser(
                        providerUser
                    );


                    showAuthMessage(
                        "Provider login successful. Opening provider portal...",
                        "success"
                    );


                    setTimeout(
                        function () {

                            window.location.href =
                                "doctor-dashboard.html";

                        },
                        500
                    );


                } else {

                    showAuthMessage(
                        "Invalid healthcare provider login. Use doctor@hrs.com / doctor123 for the demo."
                    );

                }


                return;
            }



            /* =========================================
               PATIENT LOGIN
               ========================================= */

            const users =
                getUsers();


            const normalizedIdentifier =
                normalize(identifier);


            const normalizedPhone =
                normalizePhone(identifier);


            const user =
                users.find(
                    currentUser => {

                        const emailMatch =
                            currentUser.email &&
                            normalize(
                                currentUser.email
                            ) ===
                            normalizedIdentifier;


                        const phoneMatch =
                            normalizePhone(
                                currentUser.phone
                            ) ===
                            normalizedPhone;


                        return (
                            emailMatch ||
                            phoneMatch
                        );

                    }
                );


            if (!user) {

                showAuthMessage(
                    "No patient account found with this email or phone number."
                );

                return;
            }


            if (user.password !== password) {

                showAuthMessage(
                    "Incorrect password. Please try again."
                );

                return;
            }


            /* -----------------------------------------
               SUCCESS
               ----------------------------------------- */

            setCurrentUser(
                user
            );


            showAuthMessage(
                "Login successful! Opening your health dashboard...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "dashboard.html";

                },
                500
            );

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutUser() {

    clearCurrentUser();

    window.location.href =
        "index.html";

}


window.logoutUser = logoutUser;


/* =========================================================
   PROTECT DASHBOARD
   ========================================================= */

function protectPatientPage() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    if (
        currentPage !==
        "dashboard.html"
    ) {
        return;
    }


    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        currentUser.role !== "patient"
    ) {

        window.location.href =
            "index.html";

    }

}


function protectProviderPage() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    if (
        currentPage !==
        "doctor-dashboard.html"
    ) {
        return;
    }


    const currentUser =
        getCurrentUser();


    if (
        !currentUser ||
        currentUser.role !== "provider"
    ) {

        window.location.href =
            "index.html";

    }

}


/* =========================================================
   PREVENT LOGGED-IN USER FROM SEEING LOGIN AGAIN
   ========================================================= */

function redirectIfAlreadyLoggedIn() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();


    if (
        currentPage !== "index.html" &&
        currentPage !== ""
    ) {
        return;
    }


    const currentUser =
        getCurrentUser();


    if (!currentUser) {
        return;
    }


    if (
        currentUser.role ===
        "patient"
    ) {

        window.location.href =
            "dashboard.html";

        return;
    }


    if (
        currentUser.role ===
        "provider"
    ) {

        window.location.href =
            "doctor-dashboard.html";

    }

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupRoleButtons();

        updateProviderHint();

        setupSignup();

        setupLogin();

        protectPatientPage();

        protectProviderPage();

        redirectIfAlreadyLoggedIn();

    }
);