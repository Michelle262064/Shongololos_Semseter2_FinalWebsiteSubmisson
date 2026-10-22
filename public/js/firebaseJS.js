import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

const signinSection = document.getElementById("signinSection");
const signupSection = document.getElementById("signupSection");
const signinForm = document.getElementById("signinForm");
const signupForm = document.getElementById("signupForm");
const signinMessage = document.getElementById("signinMessage");
const signupMessage = document.getElementById("signupMessage");
const showSignup = document.getElementById("showSignup");
const showSignin = document.getElementById("showSignin");

function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = "message " + type;
}

function showCard(card) {
    const isSignin = card === "signin";
    signinSection.classList.toggle("hidden", !isSignin);
    signupSection.classList.toggle("hidden", isSignin);
    showMessage(signinMessage, "", "");
    showMessage(signupMessage, "", "");
}

function getFriendlyErrorMessage(code) {
    switch (code) {
        case "auth/invalid-credential": return "Incorrect email or password.";
        case "auth/email-already-in-use": return "An account with this email already exists.";
        case "auth/weak-password": return "Password must be at least 6 characters long.";
        case "auth/invalid-email": return "Please enter a valid email address.";
        case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
        default: return "Something went wrong. Please try again.";
    }
}

async function handleSignUp(event) {
    event.preventDefault();
    const fullName = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: fullName });
        await signOut(auth);
        signupForm.reset();
        showCard("signin");
        showMessage(signinMessage, "Account created! Please sign in.", "success");
    } catch (error) {
        showMessage(signupMessage, getFriendlyErrorMessage(error.code), "error");
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value;
    const remember = document.getElementById("rememberMe").checked;

    try {
        await setPersistence(
            auth,
            remember ? browserLocalPersistence : browserSessionPersistence
        );
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = "/pages/homepage.html";
    } catch (error) {
        showMessage(signinMessage, getFriendlyErrorMessage(error.code), "error");
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = "/index.html";
    } catch (error) {
        alert("Could not log out. Please try again.");
    }
}

if (signinForm && signupForm) {
    signinForm.addEventListener("submit", handleLogin);
    signupForm.addEventListener("submit", handleSignUp);
    showSignup.addEventListener("click", e => { e.preventDefault(); showCard("signup"); });
    showSignin.addEventListener("click", e => { e.preventDefault(); showCard("signin"); });
}

document.addEventListener("click", function (e) {
    if (e.target.closest("#logout-button")) {
        e.preventDefault();
        handleLogout();
    }
});

onAuthStateChanged(auth, function (user) {
    if (!window.StreamLineAuth) return;
    if (user) {
        window.StreamLineAuth.login({ name: user.displayName, email: user.email });
    } else {
        window.StreamLineAuth.logout();
    }
});