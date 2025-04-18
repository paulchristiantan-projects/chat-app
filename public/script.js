// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCgiV2aUHHG32RjQl0iyDC6HrMJzy1q6QQ",
  authDomain: "chat-app-c049a.firebaseapp.com",
  projectId: "chat-app-c049a",
  storageBucket: "chat-app-c049a.appspot.com",
  messagingSenderId: "536210352712",
  appId: "1:536210352712:web:ebec62be8afd34880a467d"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const authSection = document.getElementById("auth-section");
const chatSection = document.getElementById("chat-section");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const userNameSpan = document.getElementById("user-name");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const loader = document.getElementById("loader");

// Modal
const modal = document.createElement("div");
modal.className = "modal hidden";
modal.innerHTML = `
  <div class="modal-content">
    <p>Account created successfully!</p>
  </div>
`;
document.body.appendChild(modal);

function showModal(duration = 2000) {
  modal.classList.remove("hidden");
  setTimeout(() => {
    modal.classList.add("hidden");
  }, duration);
}

// Loader
function showLoader() {
  loader?.classList.remove("hidden");
}

function hideLoader() {
  loader?.classList.add("hidden");
}

// Switch Forms
document.getElementById("go-to-signup").addEventListener("click", () => {
  loginForm.classList.add("hidden");
  signupForm.classList.remove("hidden");
});

document.getElementById("go-to-login").addEventListener("click", () => {
  signupForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// Sign Up
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoader();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const name = document.getElementById("signup-name").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });

    await addDoc(collection(db, "users"), {
      uid: user.uid,
      name: name
    });

    showModal();

    setTimeout(() => {
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    }, 2000);
  } catch (error) {
    alert("Error signing up: " + error.message);
  } finally {
    hideLoader();
  }
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoader();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // User state will be handled by onAuthStateChanged
  } catch (error) {
    alert("Error logging in: " + error.message);
  } finally {
    hideLoader();
  }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    chatSection.classList.add("hidden");
    authSection.classList.remove("hidden");
  } catch (error) {
    alert("Error logging out: " + error.message);
  }
});

// Send Message
document.getElementById("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (text !== "") {
    const currentUser = auth.currentUser;
    const name = currentUser ? currentUser.displayName || currentUser.email : "Anonymous";

    try {
      await addDoc(collection(db, "messages"), {
        text,
        name,
        timestamp: serverTimestamp(),
        uid: currentUser.uid
      });
      messageInput.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }
});

// Session Persistence - Load chat if already logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    showLoader();

    try {
      const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
      const snapshot = await getDocs(userQuery);
      const userData = snapshot.docs[0]?.data();
      const userName = userData?.name || user.displayName || user.email;

      authSection.classList.add("hidden");
      chatSection.classList.remove("hidden");
      userNameSpan.textContent = userName;

      const messagesRef = collection(db, "messages");
      const q = query(messagesRef, orderBy("timestamp"));

      onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach((doc) => {
          const message = doc.data();
          const div = document.createElement("div");
          const isCurrentUser = message.uid === user.uid;

          div.classList.add("message", isCurrentUser ? "sent" : "received");
          div.innerHTML = `<strong>${message.name}</strong><br>${message.text}`;
          messagesDiv.appendChild(div);
        });

        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });
    } catch (err) {
      console.error("Session load error:", err);
    } finally {
      hideLoader();
    }
  } else {
    // User is logged out
    authSection.classList.remove("hidden");
    chatSection.classList.add("hidden");
    hideLoader();
  }
});

// Hide loader once page is ready
window.addEventListener("load", () => {
  hideLoader();
});
