const { createApp, ref, reactive, onMounted } = Vue;
/*
//const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1huO7VGuZh63aIdOKRlJaae7dkAHJrxKGWaCNTnBCP1U/export?format=csv&gid=0";
const SHEET_CSV_URL = "/assets/categories.csv";

async function loadCategoriesMap() {
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("sheet not ok: " + res.status);
    const text = await res.text();
    if (text.trim().startsWith("<")) throw new Error("html instead of csv");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const map = {};
    for (const line of lines) {
      const parts = line.split(",");
      const cat = parts[0].trim();
      if (!cat || cat.toLowerCase() === "category") continue;
      const subs = parts.slice(1).map((s) => s.trim()).filter(Boolean);
      map[cat] = subs.length ? subs : ["General"];
    }
    return Object.keys(map).length
      ? map
      : { Infrastructure: ["Roads", "Water"], "Public Safety": ["Theft", "Assault"] };
  } catch (e) {
    console.warn("categories load failed", e);
    return {
      Infrastructure: ["Roads", "Water"],
      "Public Safety": ["Theft", "Assault"],
      Services: ["Garbage", "Transport"],
    };
  }
}
*/
async function loadCategoriesMap() {
  return {
    "Infrastructure": ["Roads", "Water"],
    "Public Safety": ["Theft", "Assault"],
    "Services": ["Garbage", "Transport"]
  };
}

async function login(credentials) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  // Read response as text (safe for both JSON + plain text)
  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text; // fallback if not json
  }

  // Handle errors
  if (!res.ok) {
    const msg =
      (data && data.error) ||
      (typeof data === "string" ? data : "Login failed");
    throw new Error(msg);
  }

  // Success
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

async function registerUser(credentials) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  // Read response ONCE safely
  const text = await res.text();

  // Try parsing JSON only once if needed
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      typeof data === "string" && data.trim() !== "" ? data : "Registration failed"
    );
  }
  return data;
}

async function anonymous() {
  const res = await fetch("/api/auth/anonymous", { method: "POST" });
  const data = await res.json();
  if (!res.ok) throw new Error(data || "Anon failed");
  if (data.token) localStorage.setItem("token", data.token);
  return data;
}

async function submitComplaint(form) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => {
    if (k === "files") return;
    fd.append(k, v || "");
  });
  for (const f of form.files || []) fd.append("files", f);

  const res = await fetch("/api/complaints", {
    method: "POST",
    headers: token ? { Authorization: "Bearer " + token } : {},
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data || "Submit failed");
  //console.log("FILES SENT FROM FRONTEND:", form.files);
  return data;
}

const App = {
  setup() {
    const view = ref(window.location.hash.replace("#", "") || "register");
    const categories = ref({});
    const subcategories = ref([]);
    const form = reactive({
      name: "",
      email: "",
      category: "",
      subcategory: "",
      location: "",
      dateOfIncident: "",
      description: "",
      urgency: "LOW",
      files: [],
    });
    const myComplaints = ref([]);
    const loading = ref(false);

    window.addEventListener(
      "hashchange",
      () => (view.value = window.location.hash.replace("#", "") || "register")
    );

    onMounted(async () => {
      categories.value = await loadCategoriesMap();
      const keys = Object.keys(categories.value);
      form.category = keys[0] || "";
      subcategories.value = categories.value[form.category] || [];
      form.subcategory = subcategories.value[0] || "";
    });

    const onCategoryChange = () => {
      subcategories.value = categories.value[form.category] || [];
      form.subcategory = subcategories.value[0] || "";
    };

    const onFiles = (e) => {
      //console.log("FILES PICKED:", e.target.files);
      form.files = Array.from(e.target.files || []);
    };


    async function doRegister({ username, email, password }) {
      try {
        await registerUser({ username, email, password });
        alert("Registration successful — please login.");
        window.location.hash = "#/login";
      } catch (e) {
        alert("Register failed: " + e.message);
      }
    }

    async function doLogin({ username, password }) {
      try {
        const data = await login({ username, password });
        localStorage.setItem("role", data.role);
        if (data.role === "ADMIN") {
          alert("Admin logged in!");
          window.location.hash = "#/admin";
        } else if (data.role === "OFFICER") {
          alert("Officer logged in!");
          window.location.hash = "#/officer";
        }else {
          alert("Logged in!");
          window.location.hash = "#/complaints";
        }
        await fetchMyComplaints();
      } catch (e) {
        console.error("Register failed:", e);
        alert("Login failed: " + e.message);
      }
    }

    async function doAnonymous() {
      try {
        await anonymous();
        alert("Continuing as guest.");
        window.location.hash = "#/complaints";
        await fetchMyComplaints();
      } catch {
        alert("Anonymous login failed.");
      }
    }

    async function doSubmit() {
      try {
        loading.value = true;
        const data = await submitComplaint(form);
        alert("Complaint submitted (ID=" + data.id + ")");
        Object.assign(form, {
          name: "",
          email: "",
          location: "",
          dateOfIncident: "",
          description: "",
          files: [],
        });
        await fetchMyComplaints();
      } catch (e) {
        alert("Submit failed: " + e.message);
      } finally {
        loading.value = false;
      }
    }

    async function fetchMyComplaints() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/complaints/my", {
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
        myComplaints.value = res.ok ? await res.json() : [];
      } catch {
        myComplaints.value = [];
      }
    }

    const logout = () => {
      localStorage.removeItem("token");
      myComplaints.value = [];
      window.location.hash = "#/register";
    };

    return {
      view,
      form,
      categories,
      subcategories,
      onCategoryChange,
      onFiles,
      doSubmit,
      doRegister,
      doLogin,
      doAnonymous,
      myComplaints,
      fetchMyComplaints,
      logout,
      loading,
    };
  },
  computed: {
    viewComponent() {
      const v = this.view.replace("/", "") || "register";
      if (v === "login") return "login-view";
      if (v === "register") return "register-view";
      if (v === "admin") return "admin-view";
      if (v === "officer") return "officer-view";
      if (v === "complaints") return "list-view";
      return "register-view";
    },
  },
  template: `
  <div>
    <nav class="bg-white shadow p-4 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="text-2xl font-bold text-primary">ResolveIT</div>
        <div class="text-slate-500 text-sm">Report issues — anonymous or signed in</div>
      </div>
      <div class="flex items-center space-x-3">
        <a href="#/register" class="text-slate-600 hover:text-primary">Register</a>
        <a href="#/login" class="text-slate-600 hover:text-primary">Login</a>
        <a href="#/complaints" class="text-slate-600 hover:text-primary">My Complaints</a>
        <button @click="doAnonymous" class="bg-primary text-white px-3 py-1 rounded">Guest</button>
        <button @click="logout" class="text-slate-600">Logout</button>
      </div>
    </nav>
    <div class="max-w-4xl mx-auto p-6">
      <component :is="viewComponent" 
        :form="form"
        :categories="categories"
        :subcategories="subcategories"
        :on-category-change="onCategoryChange"
        :onFiles="onFiles"
        :submit-complaint="doSubmit"
        :on-register="doRegister"
        :on-login="doLogin"
        :my-complaints="myComplaints"
        :loading="loading"
      ></component>
    </div>
  </div>`,
};

const RegisterView = {
  props: ["onRegister"],
  setup(props) {
    const username = ref("");
    const email = ref("");
    const password = ref("");
    const doRegister = () => {
      props.onRegister({
        username: username.value,
        email: email.value,
        password: password.value,
      });
    };
    return { username, email, password, doRegister };
  },
  template: `
  <div class="card p-6 bg-white rounded-xl shadow">
    <h2 class="text-xl font-bold mb-4 text-primary">Create an Account</h2>
    <div class="space-y-3">
      <input v-model="username" placeholder="Username" class="input" />
      <input v-model="email" placeholder="Email" class="input" />
      <input v-model="password" type="password" placeholder="Password" class="input" />
      <button @click="doRegister" class="btn-primary w-full bg-primary text-white py-2 rounded hover:bg-green-700">Register</button>
    </div>
  </div>`,
};

const LoginView = {
  props: ["onLogin"],
  setup(props) {
    const username = ref("");
    const password = ref("");
    const doLogin = () =>
      props.onLogin({ username: username.value, password: password.value });
    return { username, password, doLogin };
  },
  template: `
  <div class="card p-6 bg-white rounded-xl shadow">
    <h2 class="text-xl font-bold mb-4 text-primary">Login</h2>
    <div class="space-y-3">
      <input v-model="username" placeholder="Username" class="input" />
      <input v-model="password" type="password" placeholder="Password" class="input" />
      <button @click="doLogin" class="btn-primary w-full bg-primary text-white py-2 rounded hover:bg-green-700">Login</button>
    </div>
  </div>`,
};

const ListView = {
  props: [
    "myComplaints",
    "form",
    "categories",
    "subcategories",
    "onCategoryChange",
    "onFiles",
    "submitComplaint",
    "loading"
  ],
  template: `
  <div>
    <h2 class="text-xl font-bold mb-4">Submit New Complaint</h2>

    <!-- Submit Complaint Form -->
    <div class="card bg-white rounded-xl shadow p-6 mb-6">
      <form @submit.prevent="submitComplaint" enctype="multipart/form-data">
        <div class="grid grid-cols-2 gap-4">
          <div><label>Name</label><input v-model="form.name" placeholder="Your name" class="input" /></div>
          <div><label>Email</label><input v-model="form.email" placeholder="Your email" class="input" /></div>

          <div>
            <label>Category</label>
            <select v-model="form.category" @change="onCategoryChange()" class="input">
              <option v-for="c in Object.keys(categories)" :value="c">{{c}}</option>
            </select>
          </div>

          <div>
            <label>Subcategory</label>
            <select v-model="form.subcategory" class="input">
              <option v-for="s in subcategories" :value="s">{{s}}</option>
            </select>
          </div>

          <div><label>Location</label><input v-model="form.location" placeholder="Incident location" class="input" /></div>
          <div><label>Date</label><input v-model="form.dateOfIncident" type="date" class="input" /></div>
        </div>

        <div class="mt-3">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" class="input" placeholder="Describe your issue..."></textarea>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label>Urgency</label>
            <select v-model="form.urgency" class="input">
              <option value="LOW">Low</option>
              <option value="MID">Mid</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label>Upload Files</label>
            <input type="file" multiple  @change="onFiles($event)"
              accept=".jpg,.jpeg,.png,.pdf,.mp4" class="input" />
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <button class="btn-primary bg-primary text-white px-6 py-2 rounded" type="submit">
            {{ loading ? 'Submitting...' : 'Submit Complaint' }}
          </button>
        </div>
      </form>
    </div>

    <!-- My Complaints -->
    <h2 class="text-xl font-bold mb-3">My Complaints</h2>

    <div v-if="!myComplaints.length" class="card p-4 bg-gray-50">
      No complaints yet.
    </div>

    <div v-for="c in myComplaints" :key="c.id" class="card bg-white rounded-xl shadow p-4 mb-3">

      <!-- TWO COLUMN LAYOUT -->
      <div class="grid grid-cols-3 gap-4">

        <!-- LEFT SIDE — DETAILS -->
        <div class="col-span-2">

          <!-- Header -->
          <div class="flex justify-between items-center mb-2">
            <div>
              <strong>{{ c.category }}</strong> — {{ c.subcategory }}
            </div>

            <span class="px-2 py-1 text-xs rounded font-semibold"
                  :class="{
                    'bg-red-100 text-red-700': c.urgency==='HIGH',
                    'bg-yellow-100 text-yellow-700': c.urgency==='MID',
                    'bg-green-100 text-green-700': c.urgency==='LOW'
                  }">
              {{ c.urgency }}
            </span>
          </div>

          <!-- Status -->
          <span class="px-2 py-1 rounded text-xs font-bold mb-2 inline-block"
                :class="{
                  'bg-gray-200 text-gray-700': c.status==='PENDING',
                  'bg-yellow-200 text-yellow-800': c.status==='IN_PROGRESS',
                  'bg-green-200 text-green-800': c.status==='RESOLVED'
                }">
            {{ c.status || 'PENDING' }}
          </span>

          <!-- Description -->
          <div class="mt-2">{{ c.description }}</div>

          <!-- Footer -->
          <div class="text-slate-500 text-sm mt-2">
            📍 {{ c.location }} • 📅 {{ c.dateOfIncident }}
          </div>

          <!-- Officer Note -->
          <div v-if="c.solutionNote" class="mt-3 p-2 bg-gray-100 rounded text-sm">
            <strong>Officer Note:</strong> {{ c.solutionNote }}
          </div>

        </div>

        <!-- RIGHT SIDE — BIG IMAGE -->
        <div class="flex justify-center items-start">

          <!-- No attachment -->
          <div v-if="!c.attachments" 
              class="w-40 h-40 bg-gray-100 text-gray-500 flex items-center justify-center rounded">
            No Image
          </div>

          <!-- Image exists -->
          <img 
            v-else
            :src="'/uploads/' + c.attachments.split(',')[0]"
            class="w-40 h-40 object-cover rounded shadow border"
          />

        </div>

      </div>
    </div>
  </div>
  `,
};


const AdminView = {
  data() {
    return {
      activeTab: "complaints",

      complaints: [],
      loading: true,

      categoriesMap: {
        "Infrastructure": ["Roads", "Water"],
        "Public Safety": ["Theft", "Assault"],
        "Services": ["Garbage", "Transport"]
      },

      officer: {
        name: "",
        age: "",
        email: "",
        category: "",
        experience: "",
        qualification: "",
        username: "",
        password: ""
      },

      assignOfficer: {},

      officers: [],

      // chart instances
      lineChart: null,
      barChart: null,

    };
  },

  async mounted() {
    await this.loadComplaints();
  },

  computed: {
    // complaint groups
    pendingComplaints() {
      return this.complaints.filter(c => !c.status || c.status === "PENDING");
    },
    activeComplaints() {
      return this.complaints.filter(
        c => c.status === "ASSIGNED" || c.status === "IN_PROGRESS"
      );
    },
    resolvedComplaints() {
      return this.complaints.filter(c => c.status === "RESOLVED");
    },

    // group officers by department
    groupedOfficers() {
      const map = {};
      this.officers.forEach(o => {
        if (!map[o.category]) map[o.category] = [];
        map[o.category].push(o);
      });
      return map;
    },

    // ----------------- ESCALATION COMPUTED -----------------
    escalationCandidates() {
      const now = new Date();
      return this.complaints.filter(c => {
        if (!(c.status === "ASSIGNED" || c.status === "IN_PROGRESS")) return false;
        if (!c.createdAt) return false;
        const created = new Date(c.createdAt);
        const diffDays = (now - created) / (1000 * 60 * 60 * 24);
        return diffDays >= 1 && !c.markEscalated;
      });
    },

    // complaints already escalated
    activeEscalations() {
      return this.complaints.filter(c => c.markEscalated === true);
    }
  },

  methods: {
    // ---------------- IMAGE HELPER ----------------
    getFirstImage(attachments) {
      if (!attachments) return null;
      const file = attachments.split(",")[0];
      if (!file) return null;
      return "/uploads/" + file;
    },

    // mark a complaint as escalated (front-end only)
    markEscalated(id) {
      if (!this.escalatedIds.includes(id)) {
        this.escalatedIds.push(id);
      }
    },

    // ---------------- LOAD COMPLAINTS ----------------
    async loadComplaints() {
      try {
        this.loading = true;
        const res = await fetch("/api/admin/complaints", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });
        this.complaints = await res.json();

        this.complaints.forEach(c => {
          if (!this.assignOfficer[c.id]) {
            this.assignOfficer[c.id] = { category: "", officerId: "", officers: [] };
          }
        });
      } finally {
        this.loading = false;
      }
    },

    // ---------------- CREATE OFFICER ----------------
    async createOfficer() {
      try {
        const res = await fetch("/api/admin/officer/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token")
          },
          body: JSON.stringify({
            username: this.officer.username,
            passwordHash: this.officer.password,
            email: this.officer.email,
            name: this.officer.name,
            age: this.officer.age,
            category: this.officer.category,
            experience: this.officer.experience,
            qualification: this.officer.qualification
          })
        });

        if (!res.ok) throw new Error("Failed to create officer");

        alert("Officer created!");
        this.officer = {
          name: "",
          age: "",
          email: "",
          category: "",
          experience: "",
          qualification: "",
          username: "",
          password: ""
        };

        if (this.activeTab === "officers") this.loadOfficers();
      } catch (e) {
        alert("Error: " + e.message);
      }
    },

    // ---------------- LOAD OFFICERS BY CATEGORY ----------------
    async loadOfficersByCategory(cid) {
      const cat = this.assignOfficer[cid].category;
      if (!cat) return;

      const res = await fetch(`/api/admin/officer/by-category/${cat}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.assignOfficer[cid].officers = await res.json();
    },

    // ---------------- ASSIGN COMPLAINT ----------------
    async assignComplaint(cid) {
      const sel = this.assignOfficer[cid];
      if (!sel.officerId) return alert("Select officer");

      const res = await fetch("/api/admin/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
          complaintId: cid,
          officerId: sel.officerId
        })
      });

      if (res.ok) {
        alert("Assigned!");
        this.loadComplaints();
      }
    },

    // ---------------- LOAD ALL OFFICERS ----------------
    async loadOfficers() {
      const res = await fetch("/api/admin/officer/list", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this.officers = await res.json();
    },

    // --------------ANALYTICS -------------
    generateCharts() {
      this.$nextTick(() => {
        this.drawLineChart();
        this.drawBarChart();
        this.drawUrgencyPieChart();
        this.drawStatusPieChart();
      });
    },

    // Line chart – complaints over time (using createdAt)
    drawLineChart() {
      const canvas = document.getElementById("lineChart");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      const countByDate = {};
      this.complaints.forEach(c => {
        const d = c.createdAt ? c.createdAt.substring(0, 10) : null;
        if (!d) return;
        countByDate[d] = (countByDate[d] || 0) + 1;
      });

      const labels = Object.keys(countByDate).sort();
      const values = labels.map(d => countByDate[d]);

      if (this.lineChart) this.lineChart.destroy();

      this.lineChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Complaints Over Time",
            data: values,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.2)",
            tension: 0.3,
            fill: true
          }]
        }
      });
    },

    // Bar chart – avg resolution time (resolvedAt - createdAt) per department
    drawBarChart() {
      const canvas = document.getElementById("barChart");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      const deptMap = {};

      this.resolvedComplaints.forEach(c => {
        if (!c.createdAt || !c.resolvedAt) return;
        const dept = c.category || "Unknown";
        const start = new Date(c.dateOfIncident);
        const end = new Date(c.resolvedAt);
        const diffDays = Math.max(
          0,
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!deptMap[dept]) deptMap[dept] = [];
        deptMap[dept].push(diffDays);
      });

      const labels = Object.keys(deptMap);
      const values = labels.map(d => {
        const arr = deptMap[d];
        return arr.reduce((a, b) => a + b, 0) / arr.length;
      });

      if (this.barChart) this.barChart.destroy();

      this.barChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: "Avg Resolution Time (days)",
            data: values,
            backgroundColor: "#22c55e"
          }]
        }
      });
    },

    drawUrgencyPieChart() {
      const canvas = document.getElementById("urgencyPieChart");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      const urgencyMap = { HIGH: 0, MID: 0, LOW: 0 };

      this.complaints.forEach(c => {
        if (urgencyMap[c.urgency] !== undefined) {
          urgencyMap[c.urgency]++;
        }
      });

      const labels = Object.keys(urgencyMap);
      const values = Object.values(urgencyMap);

      if (this.urgencyPieChart) this.urgencyPieChart.destroy();

      this.urgencyPieChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: [
              "#ef4444", // HIGH red
              "#f59e0b", // MID yellow
              "#22c55e"  // LOW green
            ]
          }]
        }
      });
    },

    drawStatusPieChart() {
      const canvas = document.getElementById("statusPieChart");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      const statusMap = {
        PENDING: 0,
        ASSIGNED: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0
      };

      this.complaints.forEach(c => {
        const s = c.status || "PENDING";
        if (statusMap[s] !== undefined) statusMap[s]++;
      });

      const labels = Object.keys(statusMap);
      const values = Object.values(statusMap);

      if (this.statusPieChart) this.statusPieChart.destroy();

      this.statusPieChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: [
              "#6b7280", // PENDING grey
              "#fbbf24", // ASSIGNED yellow
              "#f59e0b", // IN-PROGRESS orange
              "#22c55e"  // RESOLVED green
            ]
          }]
        }
      });
    },

    // =============== ESCALATION ACTIONS ===============
    async reloadEscalations() {
        await this.loadComplaints();
        alert("Escalations reloaded!");
    },

    async sendWarning(c) {
      const note = prompt("Enter warning message for officer:");

      const res = await fetch(`/api/admin/escalation/escalate/${c.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ note })
      });

      if (!res.ok) {
        return alert("Failed to escalate complaint");
      }

      alert("Warning sent & complaint escalated!");

      await this.loadComplaints(); // reload from DB
    },



    escalatedReassign(complaintId) {
      const sel = this.assignOfficer[complaintId];
      if (!sel || !sel.officerId) {
        alert("Select a new officer first");
        return;
      }
      this.assignComplaint(complaintId);
      this.markEscalated(complaintId);
    }
  },

  template: `
  <div>

    <!-- Nav Tabs -->
    <div class="flex space-x-6 border-b pb-2 mb-6">
      <button @click="activeTab='complaints'"
        :class="activeTab==='complaints' ? 'text-primary font-bold' : 'text-gray-600'">
        Complaints
      </button>

      <button @click="activeTab='escalations'"
        :class="activeTab==='escalations' ? 'text-primary font-bold' : 'text-gray-600'">
        Escalated Complaints
      </button>

      <button @click="activeTab='analytics'; generateCharts()"
        :class="activeTab==='analytics' ? 'text-primary font-bold' : 'text-gray-600'">
        Analytics
      </button>

      <button @click="activeTab='createOfficer'"
        :class="activeTab==='createOfficer' ? 'text-primary font-bold' : 'text-gray-600'">
        Register Officer
      </button>

      <button @click="activeTab='officers'; loadOfficers()"
        :class="activeTab==='officers' ? 'text-primary font-bold' : 'text-gray-600'">
        Officers
      </button>
    </div>


    <!-- =============== ANALYTICS TAB =============== -->
    <div v-if="activeTab === 'analytics'" class="bg-white rounded-xl shadow p-6">
      <h2 class="text-2xl font-bold mb-6 text-primary">Analytics</h2>

      <div class="grid grid-cols-2 gap-6">
        <div class="p-4 bg-gray-50 rounded shadow">
          <h3 class="font-semibold mb-2">Complaints Over Time</h3>
          <canvas id="lineChart" height="200"></canvas>
        </div>

        <div class="p-4 bg-gray-50 rounded shadow">
          <h3 class="font-semibold mb-2">Avg Resolution Time (Days) by Department</h3>
          <canvas id="barChart" height="200"></canvas>
        </div>

        <div class="p-4 bg-gray-50 rounded shadow">
          <h3 class="font-semibold mb-2">Complaints by Urgency</h3>
          <canvas id="urgencyPieChart" height="200"></canvas>
        </div>

        <div class="p-4 bg-gray-50 rounded shadow">
          <h3 class="font-semibold mb-2">Complaints by Status</h3>
          <canvas id="statusPieChart" height="200"></canvas>
        </div>
      </div>
    </div>


    <!-- =============== CREATE OFFICER TAB =============== -->
    <div v-if="activeTab === 'createOfficer'" class="bg-white rounded-xl p-6 shadow">
      <h2 class="text-xl font-bold mb-4 text-primary">Create Officer Profile</h2>

      <div class="grid grid-cols-2 gap-4">
        <input class="input" v-model="officer.name" placeholder="Name">
        <input class="input" type="number" v-model="officer.age" placeholder="Age">
        <input class="input" v-model="officer.email" placeholder="Email">

        <select class="input" v-model="officer.category">
          <option disabled value="">Choose Department</option>
          <option v-for="c in Object.keys(categoriesMap)" :value="c">{{c}}</option>
        </select>

        <input class="input" v-model="officer.experience" placeholder="Experience">
        <input class="input" v-model="officer.qualification" placeholder="Qualification">

        <input class="input" v-model="officer.username" placeholder="Username">
        <input class="input" type="password" v-model="officer.password" placeholder="Password">
      </div>

      <button @click="createOfficer"
        class="mt-4 bg-primary text-white px-5 py-2 rounded">Create Officer</button>
    </div>


    <!-- =============== OFFICERS TAB =============== -->
    <div v-if="activeTab === 'officers'">
      <h2 class="text-2xl font-bold mb-6 text-primary">Officer Directory</h2>

      <div v-for="(list, dept) in groupedOfficers" class="mb-8">
        <h3 class="text-lg font-bold mb-3 text-gray-700">{{ dept }}</h3>

        <div class="space-y-4">
          <div v-for="o in list" class="bg-white p-5 rounded-xl shadow">
            <div class="flex justify-between">
              <div>
                <div class="font-semibold text-lg">{{ o.name }}</div>
                <div class="text-gray-500 text-sm">{{ o.username }} • {{ o.email }}</div>
              </div>
              <span class="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                {{ o.category }}
              </span>
            </div>

            <div class="grid grid-cols-2 mt-3 text-gray-700 text-sm gap-2">
              <div><b>Age:</b> {{ o.age }}</div>
              <div><b>Experience:</b> {{ o.experience }}</div>
              <div><b>Qualification:</b> {{ o.qualification }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- =============== ESCALATED COMPLAINTS TAB =============== -->
    <div v-if="activeTab === 'escalations'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-primary">Escalated Complaints</h2>
        <button @click="reloadEscalations"
                class="bg-blue-600 text-white px-4 py-1 rounded">
          Reload
        </button>
      </div>

      <!-- Pending Escalations -->
      <h3 class="text-lg font-bold mb-3 text-red-600">
        Pending Escalations
      </h3>

      <div v-if="!escalationCandidates.length"
           class="bg-gray-50 rounded p-4 mb-6 text-gray-600">
        No pending escalations found.
      </div>

      <div v-for="c in escalationCandidates"
           :key="'esc-p-'+c.id"
           class="bg-white rounded-xl shadow p-4 mb-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <div class="flex justify-between items-center">
              <div>
                <b>{{c.category}}</b> - {{c.subcategory}}
              </div>
              <div class="flex space-x-2 items-center">
                <span class="px-2 py-1 text-xs rounded font-semibold"
                      :class="{
                        'bg-red-100 text-red-700': c.urgency==='HIGH',
                        'bg-yellow-100 text-yellow-700': c.urgency==='MID',
                        'bg-green-100 text-green-700': c.urgency==='LOW'
                      }">
                  {{ c.urgency }}
                </span>
                <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  {{ c.status }}
                </span>
              </div>
            </div>

            <p class="mt-2">{{c.description}}</p>
            <p class="text-gray-500 text-sm mt-2">
              📅 Created: {{ c.createdAt }} • 📍 {{ c.location }}
            </p>

            <!-- Escalation Actions -->
            <div class="mt-4 space-y-3 bg-gray-50 p-3 rounded">
              <div class="flex space-x-3">
                <button @click="sendWarning(c)"
                        class="bg-red-600 text-white px-4 py-1 rounded">
                  Send Warning to Officer
                </button>
              </div>

              <div class="mt-2">
                <div class="font-semibold text-sm mb-1">
                  Reassign to another officer (optional)
                </div>

                <select v-model="assignOfficer[c.id].category"
                        class="input mb-2"
                        @change="loadOfficersByCategory(c.id)">
                  <option disabled value="">Select Department</option>
                  <option v-for="cat in Object.keys(categoriesMap)">{{cat}}</option>
                </select>

                <select v-model="assignOfficer[c.id].officerId" class="input mb-2">
                  <option disabled value="">Select Officer</option>
                  <option v-for="o in assignOfficer[c.id].officers" :value="o.id">
                    {{ o.name }} ({{ o.username }})
                  </option>
                </select>

                <button @click="escalatedReassign(c.id)"
                        class="bg-blue-600 text-white px-4 py-1 rounded">
                  Reassign Officer
                </button>
              </div>
            </div>
          </div>

          <!-- RIGHT IMAGE -->
          <div class="flex justify-center items-start">
            <div v-if="!getFirstImage(c.attachments)"
                 class="w-40 h-40 bg-gray-100 flex justify-center items-center text-gray-500 rounded">
              No Image
            </div>
            <img v-else :src="getFirstImage(c.attachments)"
                 class="w-40 h-40 object-cover rounded shadow border" />
          </div>
        </div>
      </div>

      <!-- Active Escalations -->
      <h3 class="text-lg font-bold mb-3 text-orange-600 mt-8">
        Active Escalations
      </h3>

      <div v-if="!activeEscalations.length"
           class="bg-gray-50 rounded p-4 text-gray-600">
        No active escalations yet.
      </div>

      <div v-for="c in activeEscalations"
           :key="'esc-a-'+c.id"
           class="bg-white rounded-xl shadow p-4 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <b>{{c.category}}</b> - {{c.subcategory}}
          </div>
          <span class="px-3 py-1 rounded-full bg-orange-100 text-orange-700">
            ESCALATED • {{ c.status }}
          </span>
        </div>

        <p class="mt-2">{{c.description}}</p>
        <p class="text-gray-500 text-sm mt-2">
          📅 Created: {{ c.createdAt }} • 📍 {{ c.location }}
        </p>
      </div>
    </div>


    <!-- =============== COMPLAINTS TAB =============== -->
    <div v-if="activeTab === 'complaints'">
      <h2 class="text-2xl font-bold mb-6 text-primary">Complaints</h2>

      <!-- ============ Pending Complaints ============ -->
      <h3 class="text-lg font-bold mb-3 text-red-600">Pending Complaints</h3>
      <div v-for="c in pendingComplaints" :key="'p-'+c.id" class="bg-white rounded-xl shadow p-4 mb-6">
        <div class="grid grid-cols-3 gap-4">

          <!-- LEFT -->
          <div class="col-span-2">
            <div class="flex justify-between items-center">
              <div>
                <b>{{c.category}}</b> - {{c.subcategory}}
              </div>

              <div class="flex space-x-2 items-center">
                <!-- Urgency Badge -->
                <span class="px-2 py-1 text-xs rounded font-semibold"
                      :class="{
                        'bg-red-100 text-red-700': c.urgency==='HIGH',
                        'bg-yellow-100 text-yellow-700': c.urgency==='MID',
                        'bg-green-100 text-green-700': c.urgency==='LOW'
                      }">
                  {{ c.urgency }}
                </span>

                <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-600">PENDING</span>
              </div>
            </div>

            <p class="mt-2">{{c.description}}</p>

            <p class="text-gray-500 text-sm mt-2">
              📍 {{c.location}} • 📅 {{c.dateOfIncident}}
            </p>

            <!-- Assign -->
            <div class="mt-4 bg-gray-50 p-3 rounded">
              <select v-model="assignOfficer[c.id].category"
                      class="input"
                      @change="loadOfficersByCategory(c.id)">
                <option disabled value="">Select Department</option>
                <option v-for="cat in Object.keys(categoriesMap)">{{cat}}</option>
              </select>

              <select v-model="assignOfficer[c.id].officerId" class="input mt-2">
                <option disabled value="">Select Officer</option>
                <option v-for="o in assignOfficer[c.id].officers" :value="o.id">
                  {{ o.name }} ({{ o.username }})
                </option>
              </select>

              <button @click="assignComplaint(c.id)"
                class="mt-2 bg-blue-600 text-white px-4 py-1 rounded">
                Assign
              </button>
            </div>
          </div>

          <!-- RIGHT IMAGE -->
          <div class="flex justify-center items-start">
            <div v-if="!getFirstImage(c.attachments)"
                 class="w-40 h-40 bg-gray-100 flex justify-center items-center text-gray-500 rounded">
              No Image
            </div>
            <img v-else :src="getFirstImage(c.attachments)"
                 class="w-40 h-40 object-cover rounded shadow border" />
          </div>

        </div>
      </div>


      <!-- ============ Active Complaints ============ -->
      <h3 class="text-lg font-bold mb-3 text-yellow-600">Active Complaints</h3>
      <div v-for="c in activeComplaints" :key="'a-'+c.id" class="bg-white rounded-xl shadow p-4 mb-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <div class="flex justify-between items-center">
              <div>
                <b>{{c.category}}</b> - {{c.subcategory}}
              </div>

              <div class="flex space-x-2 items-center">
                <span class="px-2 py-1 text-xs rounded font-semibold"
                      :class="{
                        'bg-red-100 text-red-700': c.urgency==='HIGH',
                        'bg-yellow-100 text-yellow-700': c.urgency==='MID',
                        'bg-green-100 text-green-700': c.urgency==='LOW'
                      }">
                  {{ c.urgency }}
                </span>

                <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  {{c.status}}
                </span>
              </div>
            </div>

            <p class="mt-2">{{c.description}}</p>

            <p class="text-gray-500 text-sm mt-2">
              📍 {{c.location}} • 📅 {{c.dateOfIncident}}
            </p>
          </div>

          <!-- RIGHT IMAGE -->
          <div class="flex justify-center items-start">
            <div v-if="!getFirstImage(c.attachments)"
                 class="w-40 h-40 bg-gray-100 flex justify-center items-center text-gray-500 rounded">
              No Image
            </div>
            <img v-else :src="getFirstImage(c.attachments)"
                 class="w-40 h-40 object-cover rounded shadow border" />
          </div>
        </div>
      </div>


      <!-- ============ Resolved Complaints ============ -->
      <h3 class="text-lg font-bold mb-3 text-green-700">Resolved Complaints</h3>
      <div v-for="c in resolvedComplaints" :key="'r-'+c.id" class="bg-white rounded-xl shadow p-4 mb-6">
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <div class="flex justify-between items-center">
              <div><b>{{c.category}}</b> - {{c.subcategory}}</div>

              <div class="flex space-x-2 items-center">
                <span class="px-2 py-1 text-xs rounded font-semibold"
                      :class="{
                        'bg-red-100 text-red-700': c.urgency==='HIGH',
                        'bg-yellow-100 text-yellow-700': c.urgency==='MID',
                        'bg-green-100 text-green-700': c.urgency==='LOW'
                      }">
                  {{ c.urgency }}
                </span>

                <span class="px-3 py-1 rounded-full bg-green-100 text-green-700">RESOLVED</span>
              </div>
            </div>

            <p class="mt-2">{{c.description}}</p>

            <p class="text-gray-500 text-sm mt-2">
              📍 {{c.location}} • 📅 {{c.dateOfIncident}}
            </p>

            <div v-if="c.solutionNote" class="mt-3 px-3 py-2 bg-green-50 border rounded">
              <b>Solution Note:</b> {{ c.solutionNote }}
            </div>
          </div>

          <!-- RIGHT IMAGE -->
          <div class="flex justify-center items-start">
            <div v-if="!getFirstImage(c.attachments)"
                 class="w-40 h-40 bg-gray-100 flex justify-center items-center text-gray-500 rounded">
              No Image
            </div>
            <img v-else :src="getFirstImage(c.attachments)"
                 class="w-40 h-40 object-cover rounded shadow border" />
          </div>
        </div>
      </div>
    </div>

  </div>
  `
};


const OfficerView = {
  data() {
    return {
      assigned: [],
      activeComplaints: [],
      resolvedComplaints: [],
      note: {},
    };
  },

  async mounted() {
    const res = await fetch("/api/officer/assigned", {
      headers: { Authorization: "Bearer " + localStorage.getItem("token") }
    });

    const list = await res.json();
    this.assigned = list;

    this.activeComplaints = list.filter(c => c.status !== "RESOLVED");
    this.resolvedComplaints = list.filter(c => c.status === "RESOLVED");
  },

  methods: {
    getFirstImage(attachments) {
      if (!attachments) return null;
      const file = attachments.split(",")[0];
      if (!file) return null;
      return "/uploads/" + file;
    },

    async updateStatus(complaintId, newStatus) {
      const res = await fetch("/api/officer/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({
          complaintId,
          status: newStatus,
          solutionNote: this.note[complaintId] || ""
        })
      });

      if (res.ok) {
        alert("Status updated!");
        location.reload();
      }
    }
  },

  template: `
    <div>

      <h2 class="text-2xl font-bold mb-4 text-primary">Active Complaints</h2>

      <div v-if="!activeComplaints.length" class="p-4 bg-gray-50 rounded mb-6">
        No active complaints.
      </div>

      <!-- Active Complaints -->
      <div v-for="c in activeComplaints" :key="c.id" class="card p-4 shadow mb-4">

        <div class="grid grid-cols-3 gap-4">

          <!-- LEFT -->
          <div class="col-span-2">

            <div v-if="c.escalationNote" class="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <b>Admin Warning:</b> {{ c.escalationNote }}
            </div>

            <h3 class="font-bold text-lg">{{ c.category }} - {{ c.subcategory }}</h3>

            <p class="mt-1">{{ c.description }}</p>

            <div class="text-sm text-gray-600 mt-1">
              📍 {{ c.location }} • 📅 {{ c.dateOfIncident }}
            </div>

            <span class="px-2 py-1 rounded text-xs font-bold mt-2 inline-block"
                  :class="{
                    'bg-gray-300 text-gray-800': c.status === 'ASSIGNED',
                    'bg-yellow-200 text-yellow-800': c.status === 'IN_PROGRESS'
                  }">
              {{ c.status }}
            </span>

            <textarea v-model="note[c.id]"
                      class="input mt-3"
                      placeholder="Add solution note"></textarea>

            <div class="flex space-x-2 mt-2">
              <button @click="updateStatus(c.id, 'IN_PROGRESS')"
                      class="bg-yellow-600 text-white px-3 py-1 rounded">
                Mark In Progress
              </button>

              <button @click="updateStatus(c.id, 'RESOLVED')"
                      class="bg-green-600 text-white px-3 py-1 rounded">
                Mark Resolved
              </button>
            </div>
          </div>

          <!-- RIGHT IMAGE -->
          <div class="flex justify-center items-start">
            <div v-if="!getFirstImage(c.attachments)"
                 class="w-40 h-40 bg-gray-100 flex justify-center items-center rounded text-gray-500">
              No Image
            </div>

            <img v-else :src="getFirstImage(c.attachments)"
                 class="w-40 h-40 object-cover rounded shadow border" />
          </div>

        </div>

      </div>


      <!-- Resolved Complaints -->
      <h2 class="text-2xl font-bold mb-4 text-primary mt-10">Resolved Complaints</h2>

      <div v-if="!resolvedComplaints.length" class="p-4 bg-gray-50 rounded">
        No resolved complaints yet.
      </div>

      <div v-for="c in resolvedComplaints" :key="c.id" 
           class="card p-4 shadow mb-4 bg-green-50 border border-green-300">

        <div class="grid grid-cols-3 gap-4">

          <div class="col-span-2">
            <div class="flex justify-between">
              <h3 class="font-bold text-lg">{{ c.category }} - {{ c.subcategory }}</h3>
              <span class="px-2 py-1 rounded text-xs font-bold bg-green-200 text-green-800">
                RESOLVED
              </span>
            </div>

            <p class="mt-1">{{ c.description }}</p>

            <div class="text-sm text-gray-600 mt-1">
              📍 {{ c.location }} • 📅 {{ c.dateOfIncident }}
            </div>

            <div v-if="c.solutionNote" class="mt-3 p-3 bg-white border rounded text-sm">
              <strong>Solution Note:</strong> {{ c.solutionNote }}
            </div>
          </div>

          <div class="flex justify-center items-start">
            <div v-if="!getFirstImage(c.attachments)"
                 class="w-40 h-40 bg-gray-100 flex justify-center items-center text-gray-500 rounded">
              No Image
            </div>
            <img v-else :src="getFirstImage(c.attachments)"
                 class="w-40 h-40 object-cover rounded shadow border" />
          </div>

        </div>
      </div>

    </div>
  `
};


createApp(App)
  .component("register-view", RegisterView)
  .component("login-view", LoginView)
  .component("list-view", ListView)
  .component("admin-view", AdminView)
  .component("officer-view", OfficerView)
  .mount("#app");
