// ========== نظام Firebase ==========
let firebaseDB = null;
let useFirebase = false;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD22y5x1w8AqSmN614G_McwEvr2vULGDz8",
  authDomain: "project1-61c69.firebaseapp.com",
  databaseURL: "https://project1-61c69-default-rtdb.firebaseio.com",
  projectId: "project1-61c69",
  storageBucket: "project1-61c69.firebasestorage.app",
  messagingSenderId: "993840544380",
  appId: "1:993840544380:web:28cd5a348ef1c7f5b167f9",
  measurementId: "G-82RRGQFHV1"
};

// Initialize Firebase
if (typeof firebase !== 'undefined') {
  try {
    firebase.initializeApp(firebaseConfig);
    firebaseDB = firebase.database();
    useFirebase = true;
    console.log("✅ Firebase متصل بنجاح!");
  } catch (e) {
    console.log("⚠️ خطأ في تهيئة Firebase:", e.message);
    useFirebase = false;
  }
} else {
  console.log("⚠️ Firebase SDK لم يتم تحميله");
  useFirebase = false;
}

// تحميل البيانات من Firebase
function loadDataFromFirebase() {
  if (!firebaseDB) return Promise.resolve();

  const p1 = firebaseDB.ref('students').once('value').then((snapshot) => {
    if (snapshot.exists()) {
      users = snapshot.val();
      console.log("تم تحميل الطلاب من Firebase");
    }
  });

  const p2 = firebaseDB.ref('attendance').once('value').then((snapshot) => {
    if (snapshot.exists()) {
      attendance = snapshot.val();
      console.log("تم تحميل سجل الحضور من Firebase");
    }
  });

  const p3 = firebaseDB.ref('schedules').once('value').then((snapshot) => {
    if (snapshot.exists()) {
      schedules = snapshot.val();
      console.log("تم تحميل المواعيد من Firebase");
    }
  });

  const p4 = firebaseDB.ref('paymentStatus').once('value').then((snapshot) => {
    if (snapshot.exists()) {
      paymentStatus = snapshot.val();
      currentPaymentMonth = paymentStatus.currentMonth || getMonthKey(new Date());
      console.log("تم تحميل حالة الدفع من Firebase");
    }
  });

  return Promise.all([p1, p2, p3, p4]).catch((e) => {
    console.log("⚠️ تعذر تحميل بعض البيانات من Firebase:", e && e.message);
  });
}

// حفظ في Firebase أو localStorage
function saveData(type, data) {
  if (useFirebase && firebaseDB) {
    if (type === 'students') firebaseDB.ref('students').set(users);
    else if (type === 'attendance') firebaseDB.ref('attendance').set(attendance);
    else if (type === 'schedules') firebaseDB.ref('schedules').set(schedules);
    else if (type === 'paymentStatus') firebaseDB.ref('paymentStatus').set(paymentStatus);
  }

  // احفظ أيضاً في localStorage كـ backup
  if (type === 'students') localStorage.setItem("students", JSON.stringify(users));
  else if (type === 'attendance') localStorage.setItem("attendance", JSON.stringify(attendance));
  else if (type === 'schedules') localStorage.setItem("schedules", JSON.stringify(schedules));
  else if (type === 'paymentStatus') localStorage.setItem("paymentStatus", JSON.stringify(paymentStatus));
}

// حمّل البيانات عند البداية
let firebaseReady = null;
if (useFirebase) {
  firebaseReady = loadDataFromFirebase();
}

// ========== نظام تبديل الوضع الليلي ==========

const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const body = document.body;

// قراءة تفضيل المستخدم المحفوظ (أو استخدام تفضيل النظام)
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.classList.add('dark-mode');
    updateThemeIcon();
  } else {
    body.classList.remove('dark-mode');
    updateThemeIcon();
  }
}

function toggleTheme() {
  body.classList.toggle('dark-mode');

  const isDarkMode = body.classList.contains('dark-mode');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

  updateThemeIcon();
}

function updateThemeIcon() {
  const isDarkMode = body.classList.contains('dark-mode');
  themeToggle.innerHTML = isDarkMode ? '<span class="theme-icon">☀️</span>' : '<span class="theme-icon">🌙</span>';
}

// ربط الزر بالدالة
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// تهيئة الوضع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initTheme);

// ========== نظام حضور الطلاب - الأكواد الأصلية ==========

let users = JSON.parse(localStorage.getItem("students")) || {};
let attendance = JSON.parse(localStorage.getItem("attendance")) || {};
let schedules = JSON.parse(localStorage.getItem("schedules")) || {};
let paymentStatus = JSON.parse(localStorage.getItem("paymentStatus")) || {}; // حالة الدفع مقسّمة حسب الشهر
let currentPaymentMonth =
  localStorage.getItem("currentPaymentMonth") || getMonthKey(new Date());
localStorage.setItem("currentPaymentMonth", currentPaymentMonth);
if (!paymentStatus[currentPaymentMonth]) {
  paymentStatus[currentPaymentMonth] = {};
  saveData('paymentStatus', paymentStatus);
}
// ترحيل تلقائي (مرة واحدة فقط) لأي بيانات دفع قديمة كانت مسجّلة قبل نظام الشهور
if (!localStorage.getItem("paymentStatusMigratedV2")) {
  const oldFlatRecords = {};
  let hadOldData = false;
  for (const key of Object.keys(paymentStatus)) {
    if (!/^\d{4}-\d{2}$/.test(key)) {
      oldFlatRecords[key] = paymentStatus[key];
      delete paymentStatus[key];
      hadOldData = true;
    }
  }
  if (hadOldData) {
    paymentStatus[currentPaymentMonth] = Object.assign(
      oldFlatRecords,
      paymentStatus[currentPaymentMonth] || {}
    );
    saveData('paymentStatus', paymentStatus);
  }
  localStorage.setItem("paymentStatusMigratedV2", "true");
  if (useFirebase && db) db.ref('metadata/paymentStatusMigratedV2').set(true);
}
const TEACHER_ID = "1515";
const TEACHER_PASSWORD = "123456789";
let currentStudent = null;
let currentTeacher = null;
let qrCode = null;
let video = null;
let canvas = null;
let context = null;
let scanning = false;
let lastScannedId = null;
let lastScannedTime = 0;
let calendarViewDate = new Date(); // الشهر المعروض حاليًا في تقويم اختيار التاريخ

// ---------- دوال مساعدة للتاريخ والأرقام العربية ----------
const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];
const ARABIC_WEEKDAYS_SHORT = ["س", "ح", "ن", "ث", "ر", "خ", "ج"]; // من السبت إلى الجمعة
const ARABIC_DAY_NAMES = [
  "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

// تحويل رقم/نص لأرقام هندية (عربية)
function toArabicDigits(value) {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(value).replace(/[0-9]/g, (d) => arabicDigits[d]);
}

// تحويل كائن Date لصيغة YYYY-MM-DD بدون مشاكل فرق التوقيت (بدون استخدام toISOString)
function toISODateLocal(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// عرض تاريخ مثل "18/9 - الجمعة"
function formatDateWithDay(dateStr) {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayName = ARABIC_DAY_NAMES[dateObj.getDay()];
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  return `${day}/${month} - ${dayName}`;
}

// ---------- تقويم اختيار التاريخ المخصص ----------
function toggleAttendanceCalendar() {
  const popup = document.getElementById("attendanceCalendarPopup");
  const isOpen = popup.style.display === "block";
  if (isOpen) {
    popup.style.display = "none";
    return;
  }
  const currentValue = document.getElementById("attendanceDate").value;
  calendarViewDate = currentValue
    ? new Date(currentValue + "T00:00:00")
    : new Date();
  renderAttendanceCalendar();
  popup.style.display = "block";
}

function changeCalendarMonth(delta) {
  calendarViewDate.setMonth(calendarViewDate.getMonth() + delta);
  renderAttendanceCalendar();
}

function renderAttendanceCalendar() {
  const popup = document.getElementById("attendanceCalendarPopup");
  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth(); // 0-indexed
  const firstOfMonth = new Date(year, month, 1);
  const startCol = (firstOfMonth.getDay() + 1) % 7; // 0 = السبت
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const selectedValue = document.getElementById("attendanceDate").value;
  const todayISO = toISODateLocal(new Date());

  let html = `
    <div class="calendar-header">
      <div class="calendar-title">${ARABIC_MONTHS[month]}, ${toArabicDigits(year)}</div>
      <div class="calendar-nav">
        <button type="button" class="calendar-nav-btn" onclick="changeCalendarMonth(1)">▲</button>
        <button type="button" class="calendar-nav-btn" onclick="changeCalendarMonth(-1)">▼</button>
      </div>
    </div>
    <div class="calendar-weekdays">
      ${ARABIC_WEEKDAYS_SHORT.map((d) => `<div class="calendar-weekday">${d}</div>`).join("")}
    </div>
    <div class="calendar-days">
  `;

  // أيام من الشهر السابق (باهتة)
  for (let i = startCol - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    html += `<div class="calendar-day other-month">${toArabicDigits(d)}</div>`;
  }

  // أيام الشهر الحالي
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISODateLocal(new Date(year, month, d));
    let cls = "calendar-day";
    if (iso === selectedValue) cls += " selected";
    else if (iso === todayISO) cls += " today";
    html += `<div class="${cls}" onclick="selectCalendarDate('${iso}')">${toArabicDigits(d)}</div>`;
  }

  // إكمال الشبكة بأيام من الشهر التالي
  const totalCells = startCol + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="calendar-day other-month">${toArabicDigits(d)}</div>`;
  }

  html += "</div>";
  popup.innerHTML = html;
}

function selectCalendarDate(iso) {
  document.getElementById("attendanceDate").value = iso;
  document.getElementById("attendanceDateTrigger").textContent = formatDateWithDay(iso);
  document.getElementById("attendanceCalendarPopup").style.display = "none";
}

// إغلاق التقويم عند الضغط خارجه
document.addEventListener("click", function (e) {
  const picker = document.getElementById("attendanceDatePicker");
  if (picker && !picker.contains(e.target)) {
    const popup = document.getElementById("attendanceCalendarPopup");
    if (popup) popup.style.display = "none";
  }
});

// منع أي ضغطة جوه التقويم (الأسهم أو الأيام) من الوصول لحدث "الضغط برّه" وإغلاقه بالغلط
(function () {
  const popupEl = document.getElementById("attendanceCalendarPopup");
  if (popupEl) {
    popupEl.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
})();

// دوال عامة
function showScreen(screenId) {
  // إيقاف الكاميرا إذا كانت تعمل
  if (screenId !== "qrScanner" && video && video.srcObject) {
    stopCamera();
  }
  // إخفاء جميع الشاشات
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  // إظهار الشاشة المطلوبة
  document.getElementById(screenId).classList.add("active");
  // تنظيف الرسائل
  document.querySelectorAll(".message").forEach((msg) => {
    msg.textContent = "";
    msg.className = "message";
  });

  // حفظ الشاشة الحالية في URL hash
  window.location.hash = screenId;

  // احفظ في localStorage أيضاً
  localStorage.setItem("currentScreen", screenId);
}

// دالة تسجيل الخروج
function logout() {
  currentStudent = null;
  currentTeacher = null;
  localStorage.setItem("currentStudentId", "");
  localStorage.setItem("currentTeacherId", "");
  localStorage.setItem("currentScreen", "mainScreen");
  showScreen("mainScreen");
}

// دالة إنشاء رقم طالب عشوائي
function generateRandomStudentId() {
  const randomId = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById("newStudentId").value = randomId;
  if (users[randomId]) {
    generateRandomStudentId();
  }
}

function generateRandomStudentIdForAdd() {
  const randomId = Math.floor(100000 + Math.random() * 900000).toString();
  document.getElementById("addStudentId").value = randomId;
  if (users[randomId]) {
    generateRandomStudentIdForAdd();
  }
}

// دالة عرض المواعيد المرتبطة بالصف المختار
function showClassSchedules() {
  const selectedClass = document.getElementById("studentClass").value;
  const groupSelect = document.getElementById("studentGroup");
  const schedulesInfo = document.getElementById("classSchedulesInfo");
  // تنظيف قائمة المجموعات
  groupSelect.innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
  if (!selectedClass) {
    schedulesInfo.innerHTML = "";
    return;
  }
  // البحث عن المواعيد المرتبطة بهذا الصف
  const classSchedules = [];
  for (const [scheduleId, schedule] of Object.entries(schedules)) {
    if (schedule.class === selectedClass) {
      classSchedules.push(schedule);
      // إضافة المجموعة إلى قائمة الاختيار
      const option = document.createElement("option");
      option.value = schedule.group;
      option.textContent = `${schedule.group} - ${schedule.time}`;
      groupSelect.appendChild(option);
    }
  }
  if (classSchedules.length > 0) {
    let html =
      '<div class="class-schedules-title">المواعيد المتاحة لهذا الصف:</div>';
    classSchedules.forEach((schedule) => {
      html += `
                <div class="class-schedule-item">
                    <strong>المجموعة:</strong> ${schedule.group} - 
                    <strong>الوقت:</strong> ${schedule.time}
                </div>
            `;
    });
    schedulesInfo.innerHTML = html;
  } else {
    schedulesInfo.innerHTML =
      '<div class="class-schedules-title" style="color: var(--danger);">لا توجد مواعيد مسجلة لهذا الصف</div>';
  }
}

// دالة عرض موعد المجموعة المختار
function showGroupSchedule() {
  // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
}

// دوال تسجيل الدخول
document
  .getElementById("studentLoginForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    studentLogin();
  });
document
  .getElementById("teacherLoginForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    teacherLogin();
  });

function studentLogin() {
  const studentId = document.getElementById("studentLoginId").value;
  const password = document.getElementById("studentPassword").value;
  const messageDiv = document.getElementById("studentLoginMessage");
  const foundUser = users[studentId];
  if (
    foundUser &&
    foundUser.type === "student" &&
    foundUser.password === password
  ) {
    currentStudent = foundUser;
    currentStudent.id = studentId;
    // احفظ بيانات الطالب
    localStorage.setItem("currentStudentId", studentId);
    localStorage.setItem("currentTeacherId", "");
    showStudentDashboard();
    messageDiv.className = "message success";
    messageDiv.textContent = "تم تسجيل الدخول بنجاح!";
    document.getElementById("studentLoginForm").reset();
  } else {
    messageDiv.className = "message error";
    messageDiv.textContent = "رقم الطالب أو كلمة المرور غير صحيحة!";
  }
}

function teacherLogin() {
  const teacherId = document.getElementById("teacherId").value;
  const password = document.getElementById("teacherPassword").value;
  const messageDiv = document.getElementById("teacherLoginMessage");
  if (teacherId === TEACHER_ID && password === TEACHER_PASSWORD) {
    currentTeacher = { id: teacherId };
    // احفظ بيانات المعلم
    localStorage.setItem("currentTeacherId", teacherId);
    localStorage.setItem("currentStudentId", "");
    showTeacherDashboard();
    messageDiv.className = "message success";
    messageDiv.textContent = "مرحباً بك أستاذ/ة!";
    document.getElementById("teacherLoginForm").reset();
  } else {
    messageDiv.className = "message error";
    messageDiv.textContent = "رقم المعلم أو كلمة المرور غير صحيحة!";
  }
}

// دوال إنشاء الحساب
document
  .getElementById("createAccountForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    createStudentAccount();
  });

function createStudentAccount() {
  const studentId = document.getElementById("newStudentId").value;
  const name = document.getElementById("newStudentName").value;
  const password = document.getElementById("newStudentPassword").value;
  const phone = document.getElementById("newStudentPhone").value;
  const fatherPhone = document.getElementById("fatherPhone").value;
  const motherPhone = document.getElementById("motherPhone").value;
  const studentClass = document.getElementById("studentClass").value;
  const studentGroup = document.getElementById("studentGroup").value;
  const lessonFee = document.getElementById("lessonFee").value;
  const messageDiv = document.getElementById("createAccountMessage");
  if (!studentId) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء إنشاء رقم طالب عشوائي!";
    return;
  }
  if (!studentClass) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء اختيار الفصل الدراسي!";
    return;
  }
  if (!studentGroup) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء اختيار موعد المجموعة!";
    return;
  }
  if (lessonFee === "" || isNaN(lessonFee) || Number(lessonFee) < 0) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء إدخال رسوم درس صحيحة!";
    return;
  }
  // التحقق من وجود موعد لهذا الصف والمجموعة (إذا تم اختيار مجموعة)
  if (studentGroup) {
    let scheduleExists = false;
    for (let schedule of Object.values(schedules)) {
      if (schedule.class === studentClass && schedule.group === studentGroup) {
        scheduleExists = true;
        break;
      }
    }
    if (!scheduleExists) {
      messageDiv.className = "message error";
      messageDiv.textContent = "لا يوجد موعد مسجل لهذا الصف والمجموعة!";
      return;
    }
  }
  if (users[studentId]) {
    messageDiv.className = "message error";
    messageDiv.textContent = "رقم الطالب مسجل مسبقاً!";
    return;
  }
  users[studentId] = {
    name: name,
    password: password,
    phone: phone,
    fatherPhone: fatherPhone,
    motherPhone: motherPhone,
    studentClass: studentClass,
    studentGroup: studentGroup,
    lessonFee: Number(lessonFee),
    type: "student",
    createdDate: new Date().toLocaleString("ar-EG")
  };
  saveData('students', users);
  messageDiv.className = "message success";
  messageDiv.textContent = "تم إنشاء الحساب بنجاح!";
  document.getElementById("createAccountForm").reset();
  document.getElementById("classSchedulesInfo").innerHTML = "";
  // إعادة تعيين قائمة المجموعات
  document.getElementById("studentGroup").innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
}

// دوال لوحة تحكم الطالب
function showStudentDashboard() {
  const studentInfo = document.getElementById("studentInfo");
  studentInfo.innerHTML = `
        <h3>معلومات الطالب</h3>
        <p><strong>الاسم:</strong> ${currentStudent.name}</p>
        <p><strong>رقم الطالب:</strong> ${currentStudent.id}</p>
        <p><strong>رقم هاتف الطالب:</strong> ${currentStudent.phone}</p>
        <p><strong>رقم هاتف الأب:</strong> ${currentStudent.fatherPhone}</p>
        <p><strong>رقم هاتف الأم:</strong> ${currentStudent.motherPhone}</p>
        <p><strong>الفصل الدراسي:</strong> ${currentStudent.studentClass}</p>
        <p><strong>موعد المجموعة:</strong> ${
          currentStudent.studentGroup || "لم يتم اختيار مجموعة"
        }</p>
        <p><strong>تاريخ التسجيل:</strong> ${currentStudent.createdDate}</p>
    `;
  document.getElementById("qrCodeContainer").innerHTML =
    '<div id="qrcode"></div>';
  showScreen("studentDashboard");
}

function showScheduleScreen() {
  showScreen("studentSchedule");
  loadAvailableSchedules();
}

function loadAvailableSchedules() {
  const schedulesContainer = document.getElementById("availableSchedules");
  if (Object.keys(schedules).length === 0) {
    schedulesContainer.innerHTML = "<p>لا توجد مواعيد متوفرة حالياً</p>";
    return;
  }
  let html = "<h3>المواعيد المتاحة</h3>";
  // ترتيب المواعيد حسب الوقت
  const sortedSchedules = Object.entries(schedules).sort((a, b) => {
    return a[1].time.localeCompare(b[1].time);
  });
  let hasSchedules = false;
  sortedSchedules.forEach(([scheduleId, schedule]) => {
    // عرض مواعيد المجموعة المحددة فقط
    if (
      currentStudent.studentGroup &&
      schedule.class === currentStudent.studentClass &&
      schedule.group === currentStudent.studentGroup
    ) {
      hasSchedules = true;
      html += `
                <div class="schedule-card">
                    <div class="schedule-time">${schedule.time}</div>
                    <div class="schedule-details">
                        <p><strong>الفصل:</strong> ${schedule.class}</p>
                        <p><strong>المجموعة:</strong> ${schedule.group}</p>
                    </div>
                </div>
            `;
    }
    // إذا لم يكن للطالب مجموعة، نعرض جميع مواعيد الصف
    else if (
      !currentStudent.studentGroup &&
      schedule.class === currentStudent.studentClass
    ) {
      hasSchedules = true;
      html += `
                <div class="schedule-card">
                    <div class="schedule-time">${schedule.time}</div>
                    <div class="schedule-details">
                        <p><strong>الفصل:</strong> ${schedule.class}</p>
                        <p><strong>المجموعة:</strong> ${schedule.group}</p>
                    </div>
                </div>
            `;
    }
  });
  if (!hasSchedules) {
    html += "<p>لا توجد مواعيد متوفرة لمجموعتك</p>";
  }
  schedulesContainer.innerHTML = html;
}

function generateQRCode() {
  const qrData = `STUDENT:${currentStudent.id}`;
  const qrContainerDiv = document.getElementById("qrCodeContainer");
  qrContainerDiv.innerHTML = `
        <div style="text-align: center;">
            <h3>رمز QR الخاص بك</h3>
            <div id="qrcode" style="display: inline-block; padding: 16px; background: #ffffff;"></div>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">
                قم بإظهار هذا الرمز للمعلم لتسجيل الحضور
            </p>
        </div>
    `;
  qrCode = new QRCode(document.getElementById("qrcode"), {
    text: qrData,
    width: 280,
    height: 280,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

// دوال لوحة تحكم المعلم
function showTeacherDashboard() {
  showScreen("teacherDashboard");
}

function showClassAttendance() {
  showScreen("selectClassScreen");
  // تعيين التاريخ الافتراضي ليوم اليوم
  const today = toISODateLocal(new Date());
  document.getElementById("attendanceDate").value = today;
  document.getElementById("attendanceDateTrigger").textContent = formatDateWithDay(today);
  document.getElementById("attendanceCalendarPopup").style.display = "none";
  document.getElementById("attendanceClass").value = "";
  document.getElementById("attendanceGroup").innerHTML =
    '<option value="">اختر المجموعة (إجباري)</option>';
  document.getElementById("classAttendanceContent").innerHTML = "";
  document.getElementById("attendanceSearchId").value = "";
}

// تحديث قائمة المجموعات حسب الصف المختار في شاشة عرض الحضور
function updateAttendanceGroupOptions() {
  const selectedClass = document.getElementById("attendanceClass").value;
  const groupSelect = document.getElementById("attendanceGroup");
  groupSelect.innerHTML = '<option value="">اختر المجموعة (إجباري)</option>';
  document.getElementById("classAttendanceContent").innerHTML = "";
  if (!selectedClass) return;
  const addedGroups = new Set();
  for (const schedule of Object.values(schedules)) {
    if (schedule.class === selectedClass && !addedGroups.has(schedule.group)) {
      addedGroups.add(schedule.group);
      const option = document.createElement("option");
      option.value = schedule.group;
      option.textContent = `${schedule.group} - ${schedule.time}`;
      groupSelect.appendChild(option);
    }
  }
}

function managePaymentStatus() {
  showScreen("managePaymentStatusScreen");
  updateCurrentPaymentMonthLabel();
  populateMonthSelect("setPaymentMonthSelect", currentPaymentMonth);
}

function viewStudentsPaymentStatus() {
  showScreen("viewPaymentStatusScreen");
  updateCurrentPaymentMonthLabel();
  populateMonthSelect("viewPaymentMonthSelect", currentPaymentMonth);
  loadStudentsPaymentStatus();
}

function updatePaymentStatus() {
  showScreen("updatePaymentStatusScreen");
  updateCurrentPaymentMonthLabel();
  loadStudentsForUpdatePaymentStatus();
}

function manageSchedules() {
  showScreen("scheduleManagement");
  loadSchedulesList();
}

function manageStudents() {
  showScreen("manageStudents");
  document.getElementById("studentsFilterClass").value = "";
  document.getElementById("studentsFilterGroup").innerHTML =
    '<option value="">اختر المجموعة</option>';
  loadStudentsListByClassAndGroup();
}

// تحديث قائمة المجموعات حسب الصف المختار في فلتر إدارة الطلاب
function updateStudentsFilterGroupOptions() {
  const selectedClass = document.getElementById("studentsFilterClass").value;
  const groupSelect = document.getElementById("studentsFilterGroup");
  groupSelect.innerHTML = '<option value="">اختر المجموعة</option>';
  if (!selectedClass) return;
  const addedGroups = new Set();
  for (const schedule of Object.values(schedules)) {
    if (schedule.class === selectedClass && !addedGroups.has(schedule.group)) {
      addedGroups.add(schedule.group);
      const option = document.createElement("option");
      option.value = schedule.group;
      option.textContent = `${schedule.group} - ${schedule.time}`;
      groupSelect.appendChild(option);
    }
  }
}

// عرض طلاب صف ومجموعة معينة فقط (حسب فلتر إدارة الطلاب)
function filterStudentsListByClassAndGroup() {
  const studentsList = document.getElementById("studentsList");
  const selectedClass = document.getElementById("studentsFilterClass").value;
  const selectedGroup = document.getElementById("studentsFilterGroup").value;

  if (!selectedClass) {
    studentsList.innerHTML =
      '<div class="message error">الرجاء اختيار الفصل الدراسي!</div>';
    return;
  }
  if (!selectedGroup) {
    studentsList.innerHTML =
      '<div class="message error">الرجاء اختيار المجموعة!</div>';
    return;
  }

  const matchedStudents = Object.entries(users).filter(
    ([, info]) =>
      info.type === "student" &&
      info.studentClass === selectedClass &&
      info.studentGroup === selectedGroup
  );

  if (matchedStudents.length === 0) {
    studentsList.innerHTML = "<p>لا يوجد طلاب في هذا الصف والمجموعة</p>";
    return;
  }

  let html = `
        <div class="class-section">
            <h4 style="color: var(--primary); margin-top: 10px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                الصف: ${selectedClass} - المجموعة: ${selectedGroup} - عدد الطلاب: ${matchedStudents.length}
            </h4>
    `;
  matchedStudents.forEach(([studentId, info]) => {
    const paymentInfo = getStudentPaymentStatus(studentId);
    html += `
            <div class="student-card">
                <div class="student-info">
                    <p><strong>الاسم:</strong> ${info.name}</p>
                    <p><strong>رقم الطالب:</strong> ${studentId}</p>
                    <p><strong>حالة الدفع:</strong> 
                        <span class="payment-status-badge ${paymentInfo.badgeClass}">
                            ${paymentInfo.status}
                        </span>
                    </p>
                </div>
                <div class="student-actions">
                    <button onclick="editStudent('${studentId}')">تعديل</button>
                    <button class="delete-btn" onclick="deleteStudentConfirm('${studentId}')">حذف</button>
                </div>
            </div>
        `;
  });
  html += "</div>";
  studentsList.innerHTML = html;
}

// دالة لعرض الطلاب مجمعة حسب الصفوف ومجموعاتهم
function loadStudentsListByClassAndGroup() {
  const studentsList = document.getElementById("studentsList");
  if (Object.keys(users).length === 0) {
    studentsList.innerHTML = "<p>لا توجد حسابات طلاب</p>";
    return;
  }
  // جمع الطلاب حسب الصف والمجموعة
  const studentsByClassAndGroup = {};
  for (const [studentId, info] of Object.entries(users)) {
    if (info.type === "student") {
      // نستخدم اسم الصف والمجموعة كمفتاح
      const classAndGroupKey = `${info.studentClass}-${
        info.studentGroup || "بدون مجموعة"
      }`;
      if (!studentsByClassAndGroup[classAndGroupKey]) {
        studentsByClassAndGroup[classAndGroupKey] = {
          class: info.studentClass,
          group: info.studentGroup || "بدون مجموعة",
          students: []
        };
      }
      studentsByClassAndGroup[classAndGroupKey].students.push({
        id: studentId,
        info: info
      });
    }
  }
  // عرض الطلاب مجمعة حسب الصف والمجموعة
  let html = "<h3>جميع الطلاب مجمعة حسب الصف والمجموعة</h3>";
  if (Object.keys(studentsByClassAndGroup).length === 0) {
    html += "<p>لا توجد حسابات طلاب</p>";
    studentsList.innerHTML = html;
    return;
  }
  // ترتيب الصفوف والأجزاء أبجديًا
  const sortedKeys = Object.keys(studentsByClassAndGroup).sort((a, b) => {
    const [classA, groupA] = a.split("-");
    const [classB, groupB] = b.split("-");
    if (classA !== classB) {
      return classA.localeCompare(classB); // ترتيب الصفوف
    }
    return groupA.localeCompare(groupB); // ترتيب المجموعات
  });
  sortedKeys.forEach((key) => {
    const classAndGroup = studentsByClassAndGroup[key];
    const groupDisplay =
      classAndGroup.group === "بدون مجموعة"
        ? "بدون مجموعة"
        : classAndGroup.group;
    html += `
            <div class="class-section">
                <h4 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                    الصف: ${classAndGroup.class} - المجموعة: ${groupDisplay} - عدد الطلاب: ${classAndGroup.students.length}
                </h4>
        `;
    classAndGroup.students.forEach((student) => {
      const paymentInfo = getStudentPaymentStatus(student.id);
      html += `
                <div class="student-card">
                    <div class="student-info">
                        <p><strong>الاسم:</strong> ${student.info.name}</p>
                        <p><strong>رقم الطالب:</strong> ${student.id}</p>
                        <p><strong>حالة الدفع:</strong> 
                            <span class="payment-status-badge ${paymentInfo.badgeClass}">
                                ${paymentInfo.status}
                            </span>
                        </p>
                    </div>
                    <div class="student-actions">
                        <button onclick="editStudent('${student.id}')">تعديل</button>
                        <button class="delete-btn" onclick="deleteStudentConfirm('${student.id}')">حذف</button>
                    </div>
                </div>
            `;
    });
    html += "</div>";
  });
  studentsList.innerHTML = html;
}

function searchStudents() {
  const searchTerm = document
    .getElementById("searchStudent")
    .value.toLowerCase();
  const studentsList = document.getElementById("studentsList");
  let html = "<h3>نتائج البحث</h3>";
  let found = false;
  // جمع الطلاب حسب الصف والمجموعة
  const studentsByClassAndGroup = {};
  for (const [studentId, info] of Object.entries(users)) {
    if (
      info.type === "student" &&
      (info.name.toLowerCase().includes(searchTerm) ||
        studentId.includes(searchTerm) ||
        info.studentClass.toLowerCase().includes(searchTerm) ||
        (info.studentGroup &&
          info.studentGroup.toLowerCase().includes(searchTerm)))
    ) {
      const classAndGroupKey = `${info.studentClass}-${
        info.studentGroup || "بدون مجموعة"
      }`;
      if (!studentsByClassAndGroup[classAndGroupKey]) {
        studentsByClassAndGroup[classAndGroupKey] = {
          class: info.studentClass,
          group: info.studentGroup || "بدون مجموعة",
          students: []
        };
      }
      studentsByClassAndGroup[classAndGroupKey].students.push({
        id: studentId,
        info: info
      });
      found = true;
    }
  }
  if (found) {
    // ترتيب الصفوف والأجزاء أبجديًا
    const sortedKeys = Object.keys(studentsByClassAndGroup).sort((a, b) => {
      const [classA, groupA] = a.split("-");
      const [classB, groupB] = b.split("-");
      if (classA !== classB) {
        return classA.localeCompare(classB); // ترتيب الصفوف
      }
      return groupA.localeCompare(groupB); // ترتيب المجموعات
    });
    sortedKeys.forEach((key) => {
      const classAndGroup = studentsByClassAndGroup[key];
      const groupDisplay =
        classAndGroup.group === "بدون مجموعة"
          ? "بدون مجموعة"
          : classAndGroup.group;
      html += `
                <div class="class-section">
                    <h4 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                        الصف: ${classAndGroup.class} - المجموعة: ${groupDisplay} - عدد الطلاب: ${classAndGroup.students.length}
                    </h4>
            `;
      classAndGroup.students.forEach((student) => {
        const paymentInfo = getStudentPaymentStatus(student.id);
        html += `
                    <div class="student-card">
                        <div class="student-info">
                            <p><strong>الاسم:</strong> ${student.info.name}</p>
                            <p><strong>رقم الطالب:</strong> ${student.id}</p>
                            <p><strong>حالة الدفع:</strong> 
                                <span class="payment-status-badge ${paymentInfo.badgeClass}">
                                    ${paymentInfo.status}
                                </span>
                            </p>
                        </div>
                        <div class="student-actions">
                            <button onclick="editStudent('${student.id}')">تعديل</button>
                            <button class="delete-btn" onclick="deleteStudentConfirm('${student.id}')">حذف</button>
                        </div>
                    </div>
                `;
      });
      html += "</div>";
    });
  } else if (searchTerm) {
    html = "<p>لم يتم العثور على طلاب مطابقين</p>";
  } else {
    loadStudentsListByClassAndGroup(); // استخدم الدالة الجديدة هنا أيضًا
    return;
  }
  studentsList.innerHTML = html;
}

function loadSchedulesList() {
  const schedulesList = document.getElementById("schedulesList");
  if (Object.keys(schedules).length === 0) {
    schedulesList.innerHTML = "<p>لا توجد مواعيد مسجلة</p>";
    return;
  }
  let html = "<h3>جميع المواعيد</h3>";
  // ترتيب المواعيد حسب الوقت
  const sortedSchedules = Object.entries(schedules).sort((a, b) => {
    return b[1].time.localeCompare(a[1].time); // ترتيب تنازلي
  });
  sortedSchedules.forEach(([scheduleId, schedule]) => {
    html += `
            <div class="schedule-card">
                <div class="schedule-time">${schedule.time}</div>
                <div class="schedule-details">
                    <p><strong>الفصل:</strong> ${schedule.class}</p>
                    <p><strong>المجموعة:</strong> ${schedule.group}</p>
                </div>
                <div class="schedule-actions">
                    <button class="delete-btn" onclick="deleteSchedule('${scheduleId}')">حذف</button>
                </div>
            </div>
        `;
  });
  schedulesList.innerHTML = html;
}

// نموذج إضافة الموعد
document
  .getElementById("scheduleForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    addSchedule();
  });

function addSchedule() {
  const time = document.getElementById("scheduleTime").value;
  const scheduleClass = document.getElementById("scheduleClass").value;
  const group = document.getElementById("scheduleGroup").value;
  const messageDiv = document.getElementById("scheduleMessage");
  if (!time || !scheduleClass || !group) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء ملء جميع الحقول!";
    return;
  }
  // التحقق من عدم تكرار الموعد لنفس الفصل والمجموعة
  for (let schedule of Object.values(schedules)) {
    if (schedule.class === scheduleClass && schedule.group === group) {
      messageDiv.className = "message error";
      messageDiv.textContent = "يوجد بالفعل موعد لهذا الفصل وهذه المجموعة!";
      return;
    }
  }
  const scheduleId = Date.now().toString();
  schedules[scheduleId] = {
    time: time,
    class: scheduleClass,
    group: group,
    createdAt: new Date().toLocaleString("ar-EG")
  };
  saveData('schedules', schedules);
  messageDiv.className = "message success";
  messageDiv.textContent = "تم إضافة الموعد بنجاح!";
  // تنظيف النموذج
  document.getElementById("scheduleForm").reset();
  // إعادة تحميل القائمة
  loadSchedulesList();
}

function deleteSchedule(scheduleId) {
  if (confirm("هل أنت متأكد من حذف هذا الموعد؟")) {
    delete schedules[scheduleId];
    saveData('schedules', schedules);
    loadSchedulesList();
  }
}

// دالة مطلوبة عند تغيير الفصل في فورم إضافة موعد جديد
// (اسم المجموعة هنا حقل نصي حر وليس قائمة منسدلة، فلا يوجد ما يتم تحديثه فعليًا،
// لكن الدالة لازم تكون موجودة حتى لا يظهر خطأ في الكونسول)
function updateGroupOptions() {
  // لا يوجد إجراء مطلوب حاليًا لأن حقل المجموعة هنا نصي وليس قائمة اختيار
}

function showAddStudentForm() {
  showScreen("addStudentForm");
  generateRandomStudentIdForAdd();
  // تهيئة قائمة المجموعات
  document.getElementById("addStudentGroup").innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
}

function editStudent(studentId) {
  const student = users[studentId];
  document.getElementById("editStudentId").value = studentId;
  document.getElementById("editStudentName").value = student.name;
  document.getElementById("editStudentPhone").value = student.phone;
  document.getElementById("editFatherPhone").value = student.fatherPhone;
  document.getElementById("editMotherPhone").value = student.motherPhone;
  document.getElementById("editStudentClass").value = student.studentClass;
  document.getElementById("editLessonFee").value = student.lessonFee || "";
  // تحديث قائمة المجموعات
  updateEditGroupSelect(student.studentClass, student.studentGroup);
  showScreen("editStudentForm");
}

// دالة تحديث قائمة المجموعات في نموذج التعديل
function updateEditGroupSelect(selectedClass, currentGroup = "") {
  const groupSelect = document.getElementById("editStudentGroup");
  groupSelect.innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
  if (selectedClass) {
    for (const [scheduleId, schedule] of Object.entries(schedules)) {
      if (schedule.class === selectedClass) {
        const option = document.createElement("option");
        option.value = schedule.group;
        option.textContent = `${schedule.group} - ${schedule.time}`;
        if (schedule.group === currentGroup) {
          option.selected = true;
        }
        groupSelect.appendChild(option);
      }
    }
  }
}

// دالة تحديث قائمة المجموعات في نموذج الإضافة
function updateAddGroupSelect(selectedClass, currentGroup = "") {
  const groupSelect = document.getElementById("addStudentGroup");
  groupSelect.innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
  if (selectedClass) {
    for (const [scheduleId, schedule] of Object.entries(schedules)) {
      if (schedule.class === selectedClass) {
        const option = document.createElement("option");
        option.value = schedule.group;
        option.textContent = `${schedule.group} - ${schedule.time}`;
        if (schedule.group === currentGroup) {
          option.selected = true;
        }
        groupSelect.appendChild(option);
      }
    }
  }
}

function deleteStudentConfirm(studentId) {
  if (confirm("هل أنت متأكد من حذف هذا الطالب؟")) {
    deleteStudent(studentId);
  }
}

function deleteStudent(studentId) {
  if (typeof studentId === "string") {
    // حذف من الزر
    delete users[studentId];
    // حذف حالة الدفع أيضاً (من كل الشهور)
    removeStudentPaymentRecords(studentId);
    saveData('students', users);
    loadStudentsListByClassAndGroup();
    showScreen("manageStudents");
  } else {
    // حذف من نموذج التعديل
    const id = document.getElementById("editStudentId").value;
    delete users[id];
    // حذف حالة الدفع أيضاً (من كل الشهور)
    removeStudentPaymentRecords(id);
    saveData('students', users);
    loadStudentsListByClassAndGroup();
    showScreen("manageStudents");
  }
}

// نموذج تعديل الطالب
document
  .getElementById("studentEditForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    updateStudent();
  });

function updateStudent() {
  const studentId = document.getElementById("editStudentId").value;
  const name = document.getElementById("editStudentName").value;
  const password = document.getElementById("editStudentPassword").value;
  const phone = document.getElementById("editStudentPhone").value;
  const fatherPhone = document.getElementById("editFatherPhone").value;
  const motherPhone = document.getElementById("editMotherPhone").value;
  const studentClass = document.getElementById("editStudentClass").value;
  const studentGroup = document.getElementById("editStudentGroup").value;
  const lessonFee = document.getElementById("editLessonFee").value;
  const messageDiv = document.getElementById("editStudentMessage");
  if (!studentClass) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء اختيار الفصل الدراسي!";
    return;
  }
  if (!studentGroup) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء اختيار موعد المجموعة!";
    return;
  }
  if (lessonFee === "" || isNaN(lessonFee) || Number(lessonFee) < 0) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء إدخال رسوم درس صحيحة!";
    return;
  }
  // التحقق من وجود موعد لهذا الصف والمجموعة
  let scheduleExists = false;
  for (let schedule of Object.values(schedules)) {
    if (schedule.class === studentClass && schedule.group === studentGroup) {
      scheduleExists = true;
      break;
    }
  }
  if (!scheduleExists) {
    messageDiv.className = "message error";
    messageDiv.textContent = "لا يوجد موعد مسجل لهذا الصف والمجموعة!";
    return;
  }
  users[studentId].name = name;
  users[studentId].phone = phone;
  users[studentId].fatherPhone = fatherPhone;
  users[studentId].motherPhone = motherPhone;
  users[studentId].studentClass = studentClass;
  users[studentId].studentGroup = studentGroup;
  users[studentId].lessonFee = Number(lessonFee);
  if (password) {
    users[studentId].password = password;
  }
  saveData('students', users);
  messageDiv.className = "message success";
  messageDiv.textContent = "تم تحديث بيانات الطالب بنجاح!";
  setTimeout(() => {
    loadStudentsListByClassAndGroup();
    showScreen("manageStudents");
  }, 1500);
}

// نموذج إضافة طالب من المعلم
document
  .getElementById("teacherAddStudentForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    addStudentByTeacher();
  });

function addStudentByTeacher() {
  const studentId = document.getElementById("addStudentId").value;
  const name = document.getElementById("addStudentName").value;
  const password = document.getElementById("addStudentPassword").value;
  const phone = document.getElementById("addStudentPhone").value;
  const fatherPhone = document.getElementById("addFatherPhone").value;
  const motherPhone = document.getElementById("addMotherPhone").value;
  const studentClass = document.getElementById("addStudentClass").value;
  const studentGroup = document.getElementById("addStudentGroup").value;
  const lessonFee = document.getElementById("addLessonFee").value;
  const messageDiv = document.getElementById("addStudentMessage");
  if (!studentId) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء إنشاء رقم طالب عشوائي!";
    return;
  }
  if (!studentClass) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء اختيار الفصل الدراسي!";
    return;
  }
  if (!studentGroup) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء اختيار موعد المجموعة!";
    return;
  }
  if (lessonFee === "" || isNaN(lessonFee) || Number(lessonFee) < 0) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء إدخال رسوم درس صحيحة!";
    return;
  }
  // التحقق من وجود موعد لهذا الصف والمجموعة
  let scheduleExists = false;
  for (let schedule of Object.values(schedules)) {
    if (schedule.class === studentClass && schedule.group === studentGroup) {
      scheduleExists = true;
      break;
    }
  }
  if (!scheduleExists) {
    messageDiv.className = "message error";
    messageDiv.textContent = "لا يوجد موعد مسجل لهذا الصف والمجموعة!";
    return;
  }
  if (users[studentId]) {
    messageDiv.className = "message error";
    messageDiv.textContent = "رقم الطالب مسجل مسبقاً!";
    return;
  }
  users[studentId] = {
    name: name,
    password: password,
    phone: phone,
    fatherPhone: fatherPhone,
    motherPhone: motherPhone,
    studentClass: studentClass,
    studentGroup: studentGroup,
    lessonFee: Number(lessonFee),
    type: "student",
    createdDate: new Date().toLocaleString("ar-EG")
  };
  saveData('students', users);
  messageDiv.className = "message success";
  messageDiv.textContent = "تم إضافة الطالب بنجاح!";
  setTimeout(() => {
    document.getElementById("teacherAddStudentForm").reset();
    loadStudentsListByClassAndGroup();
    showScreen("manageStudents");
  }, 1500);
}

function showAttendanceScanner() {
  showScreen("qrScanner");
  video = document.getElementById("video");
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  lastScannedId = null;
  lastScannedTime = 0;
}

function showManualAttendance() {
  showScreen("manualAttendance");
  document.getElementById("manualStudentId").value = "";
}

// دوال ماسح QR بالكاميرا
function startCamera() {
  const messageDiv = document.getElementById("scannerMessage");
  const startBtn = document.getElementById("startCamera");
  const stopBtn = document.getElementById("stopCamera");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الكاميرا غير مدعومة في هذا المتصفح!";
    return;
  }
  navigator.mediaDevices
    .getUserMedia({
      video: { facingMode: "environment" }
    })
    .then(function (stream) {
      video.setAttribute("playsinline", "true");
      video.muted = true;
      video.srcObject = stream;
      video.play();
      scanning = true;
      startBtn.style.display = "none";
      stopBtn.style.display = "block";
      messageDiv.className = "message success";
      messageDiv.textContent = "الكاميرا تعمل الآن. قم بمسح رمز QR للطالب";
      scanQRCode();
    })
    .catch(function (err) {
      messageDiv.className = "message error";
      messageDiv.textContent = "خطأ في تشغيل الكاميرا: " + err.message;
      console.error("خطأ في الكاميرا:", err);
    });
}

function stopCamera() {
  if (video && video.srcObject) {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(function (track) {
      track.stop();
    });
    video.srcObject = null;
    scanning = false;
    document.getElementById("startCamera").style.display = "block";
    document.getElementById("stopCamera").style.display = "none";
    document.getElementById("scannerMessage").textContent = "";
  }
}

let barcodeDetector = null;
try {
  if ("BarcodeDetector" in window) {
    barcodeDetector = new BarcodeDetector({ formats: ["qr_code"] });
  }
} catch (e) {
  barcodeDetector = null;
}

async function scanQRCode() {
  if (!scanning) return;
  try {
    if (video.readyState >= 2 && video.videoWidth) {
      let result = null;

      // 1) القارئ المدمج في المتصفح (الأسرع والأدق) لو متاح
      if (barcodeDetector) {
        try {
          const found = await barcodeDetector.detect(video);
          if (found && found.length) result = found[0].rawValue;
        } catch (e) {
          barcodeDetector = null; // لو فشل نكمل بـ jsQR
        }
      }

      // 2) jsQR كبديل
      if (!result && window.jsQR) {
        const scale = Math.min(1, 1024 / video.videoWidth);
        const w = Math.floor(video.videoWidth * scale);
        const h = Math.floor(video.videoHeight * scale);
        canvas.width = w;
        canvas.height = h;
        context.drawImage(video, 0, 0, w, h);
        const imageData = context.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, w, h, { inversionAttempts: "dontInvert" });
        if (code && code.data) result = code.data;
      }

      if (result) {
        processQRCode(String(result).trim());
        setTimeout(scanQRCode, 1000);
        return;
      }
    }
  } catch (err) {
    console.error("خطأ في قراءة QR:", err);
  }
  setTimeout(scanQRCode, 120);
}

function processQRCode(qrData) {
  const messageDiv = document.getElementById("scannerMessage");
  if (qrData.startsWith("STUDENT:")) {
    const parts = qrData.split(":");
    if (parts.length >= 2) {
      const studentId = parts[1].trim();
      if (users[studentId] && users[studentId].type === "student") {
        const studentName = users[studentId].name;
        const now = Date.now();
        // منع إعادة المعالجة الفورية لو نفس الكود لسه قدام الكاميرا في نفس اللحظة
        if (studentId === lastScannedId && now - lastScannedTime < 5000) {
          return;
        }
        lastScannedId = studentId;
        lastScannedTime = now;
        const recorded = recordAttendance(studentId, studentName);
        if (recorded) {
          messageDiv.className = "message success";
          messageDiv.textContent = `✅ تم تسجيل حضور الطالب: ${studentName} — وجّه الكاميرا للطالب التالي`;
        } else {
          messageDiv.className = "message error";
          messageDiv.textContent = `⚠️ الطالب ${studentName} سجل حضوره بالفعل اليوم — وجّه الكاميرا للطالب التالي`;
        }
      } else {
        messageDiv.className = "message error";
        messageDiv.textContent = "❌ رمز QR غير صحيح!";
      }
    } else {
      messageDiv.className = "message error";
      messageDiv.textContent = "❌ تنسيق رمز QR غير صحيح!";
    }
  } else {
    messageDiv.className = "message error";
    messageDiv.textContent = "❌ هذا ليس رمز QR لطالب!";
  }

}

// تسجيل حضور يدوي
function manualAttendance() {
  const studentId = document.getElementById("manualStudentId").value;
  const messageDiv = document.getElementById("manualAttendanceMessage");
  if (!studentId.trim()) {
    messageDiv.className = "message error";
    messageDiv.textContent = "الرجاء إدخال رقم الطالب!";
    return;
  }
  if (users[studentId] && users[studentId].type === "student") {
    const recorded = recordAttendance(studentId, users[studentId].name);
    if (recorded) {
      messageDiv.className = "message success";
      messageDiv.textContent = `✅ تم تسجيل حضور الطالب: ${users[studentId].name}`;
    } else {
      messageDiv.className = "message error";
      messageDiv.textContent = `⚠️ الطالب ${users[studentId].name} سجل حضوره بالفعل اليوم!`;
    }
    document.getElementById("manualStudentId").value = "";
  } else {
    messageDiv.className = "message error";
    messageDiv.textContent = "❌ رقم الطالب غير صحيح!";
  }
}

function recordAttendance(studentId, studentName) {
  const today = toISODateLocal(new Date());
  if (!attendance[today]) {
    attendance[today] = {};
  }
  // الطالب سجل حضوره بالفعل اليوم (سواء بالكيو آر كود أو يدويًا) - منع التسجيل مرة تانية
  if (attendance[today][studentId]) {
    return false;
  }
  const timeNow = new Date().toLocaleTimeString("ar-EG");
  attendance[today][studentId] = {
    name: studentName,
    time: timeNow,
    status: "حضور"
  };
  saveData('attendance', attendance);
  return true;
}

function viewTodayAttendance() {
  const today = toISODateLocal(new Date());
  const contentDiv = document.getElementById("teacherContent");
  let html = `<h3>حضور اليوم (${today})</h3>`;
  if (attendance[today] && Object.keys(attendance[today]).length > 0) {
    for (const [studentId, info] of Object.entries(attendance[today])) {
      html += `
                <div class="attendance-record">
                    <p><strong>رقم الطالب:</strong> ${studentId}</p>
                    <p><strong>الاسم:</strong> ${info.name}</p>
                    <p><strong>الوقت:</strong> ${info.time}</p>
                </div>
            `;
    }
  } else {
    html += "<p>لا توجد حضور مسجل لليوم</p>";
  }
  contentDiv.innerHTML = html;
  showScreen("teacherDashboard");
}

function viewAllAttendance() {
  const contentDiv = document.getElementById("teacherContent");
  if (Object.keys(attendance).length === 0) {
    contentDiv.innerHTML = "<p>لا توجد سجلات حضور</p>";
    showScreen("teacherDashboard");
    return;
  }
  let html = "<h3>سجل الحضور الكامل</h3>";
  const dates = Object.keys(attendance).sort().reverse();
  dates.forEach((date) => {
    const students = attendance[date];
    html += `<h4 style="margin-top: 20px; color: var(--primary);">التاريخ: ${date}</h4><hr>`;
    for (const [studentId, info] of Object.entries(students)) {
      html += `
                <div class="attendance-record">
                    <p><strong>رقم الطالب:</strong> ${studentId}</p>
                    <p><strong>الاسم:</strong> ${info.name}</p>
                    <p><strong>الوقت:</strong> ${info.time}</p>
                    <p><strong>الحالة:</strong> ${info.status}</p>
                </div>
            `;
    }
  });
  contentDiv.innerHTML = html;
  showScreen("teacherDashboard");
}

// عرض حضور صف معين في تاريخ معين (الحاضرون والغائبون)
function viewClassAttendance() {
  const selectedClass = document.getElementById("attendanceClass").value;
  const selectedGroup = document.getElementById("attendanceGroup").value;
  const selectedDate = document.getElementById("attendanceDate").value;
  const contentDiv = document.getElementById("classAttendanceContent");

  if (!selectedClass) {
    contentDiv.innerHTML =
      '<div class="message error">الرجاء اختيار الفصل الدراسي!</div>';
    return;
  }
  if (!selectedGroup) {
    contentDiv.innerHTML =
      '<div class="message error">الرجاء اختيار المجموعة!</div>';
    return;
  }
  if (!selectedDate) {
    contentDiv.innerHTML =
      '<div class="message error">الرجاء اختيار التاريخ!</div>';
    return;
  }

  // طلاب هذا الصف والمجموعة فقط
  const classStudents = Object.entries(users).filter(
    ([, info]) =>
      info.type === "student" &&
      info.studentClass === selectedClass &&
      info.studentGroup === selectedGroup
  );

  if (classStudents.length === 0) {
    contentDiv.innerHTML = "<p>لا يوجد طلاب مسجلون في هذا الصف والمجموعة</p>";
    return;
  }

  // تقسيم طلاب الفصل حسب المجموعة
  const studentsByGroup = {};
  classStudents.forEach(([studentId, info]) => {
    const groupName = info.studentGroup || "بدون مجموعة";
    if (!studentsByGroup[groupName]) studentsByGroup[groupName] = [];
    studentsByGroup[groupName].push({ id: studentId, info: info });
  });

  const dayAttendance = attendance[selectedDate] || {};
  const dateLabel = formatDateWithDay(selectedDate);

  let totalPresent = 0;
  let totalAbsent = 0;
  classStudents.forEach(([studentId]) => {
    if (dayAttendance[studentId]) totalPresent++;
    else totalAbsent++;
  });

  let html = `
        <div class="attendance-summary">
            <p><strong>الفصل:</strong> ${selectedClass} &nbsp;|&nbsp; <strong>اليوم:</strong> ${dateLabel}</p>
            <p>عدد الطلاب: ${classStudents.length} — الحاضرون: ${totalPresent} — الغائبون: ${totalAbsent}</p>
        </div>
    `;

  // ترتيب المجموعات أبجديًا
  const sortedGroups = Object.keys(studentsByGroup).sort();
  sortedGroups.forEach((groupName) => {
    const groupStudents = studentsByGroup[groupName];
    const present = [];
    const absent = [];
    groupStudents.forEach((student) => {
      if (dayAttendance[student.id]) {
        present.push({
          id: student.id,
          info: student.info,
          time: dayAttendance[student.id].time
        });
      } else {
        absent.push(student);
      }
    });

    html += `
            <div class="class-section">
                <h4 class="class-schedules-title" style="border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                    المجموعة: ${groupName} — عدد الطلاب: ${groupStudents.length} (حاضر: ${present.length} / غائب: ${absent.length})
                </h4>
                <div class="present-students">
                    <h4>الطلاب الحاضرون</h4>
        `;
    if (present.length === 0) {
      html += "<p>لا يوجد طلاب حاضرون</p>";
    } else {
      present.forEach((student) => {
        html += `
                    <div class="student-item" data-student-id="${student.id}">
                        <span><strong>${student.info.name}</strong> (${student.id})</span>
                        <span>${student.time}</span>
                    </div>
                `;
      });
    }
    html += `
                </div>
                <div class="absent-students">
                    <h4>الطلاب الغائبون</h4>
        `;
    if (absent.length === 0) {
      html += "<p>لا يوجد طلاب غائبون</p>";
    } else {
      absent.forEach((student) => {
        html += `
                    <div class="student-item" data-student-id="${student.id}">
                        <span><strong>${student.info.name}</strong> (${student.id})</span>
                    </div>
                `;
      });
    }
    html += `
                </div>
            </div>
        `;
  });

  contentDiv.innerHTML = html;
  document.getElementById("attendanceSearchId").value = "";
}

// البحث عن طالب برقمه مباشرة (من غير الحاجة لاختيار الصف أو المجموعة)
function searchAttendanceById() {
  const searchTerm = document.getElementById("attendanceSearchId").value.trim();
  const contentDiv = document.getElementById("classAttendanceContent");
  const selectedDate = document.getElementById("attendanceDate").value;

  // لو خانة البحث فاضية: ارجع للعرض العادي حسب الصف والمجموعة لو متاختارين
  if (!searchTerm) {
    const selectedClass = document.getElementById("attendanceClass").value;
    const selectedGroup = document.getElementById("attendanceGroup").value;
    if (selectedClass && selectedGroup) {
      viewClassAttendance();
    } else {
      contentDiv.innerHTML = "";
    }
    return;
  }

  if (!selectedDate) {
    contentDiv.innerHTML =
      '<div class="message error">الرجاء اختيار التاريخ!</div>';
    return;
  }

  // البحث في كل الطلاب المسجلين بغض النظر عن الصف أو المجموعة
  const matchedStudents = Object.entries(users).filter(
    ([studentId, info]) =>
      info.type === "student" && studentId.includes(searchTerm)
  );

  if (matchedStudents.length === 0) {
    contentDiv.innerHTML = "<p>لا يوجد طالب بهذا الرقم</p>";
    return;
  }

  const dayAttendance = attendance[selectedDate] || {};
  const dateLabel = formatDateWithDay(selectedDate);

  let html = `
        <div class="attendance-summary">
            <p><strong>نتيجة البحث برقم الطالب</strong> &nbsp;|&nbsp; <strong>اليوم:</strong> ${dateLabel}</p>
        </div>
    `;

  matchedStudents.forEach(([studentId, info]) => {
    const isPresent = !!dayAttendance[studentId];
    const sectionClass = isPresent ? "present-students" : "absent-students";
    const statusText = isPresent
      ? `حاضر — الوقت: ${dayAttendance[studentId].time}`
      : "غائب";
    html += `
            <div class="${sectionClass}">
                <div class="student-item" data-student-id="${studentId}">
                    <span>
                        <strong>${info.name}</strong> (${studentId})
                        — ${info.studentClass} / ${info.studentGroup || "بدون مجموعة"}
                    </span>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
  });

  contentDiv.innerHTML = html;
}

// دوال إدارة حالة الدفع

// عند تغيير الشهر المعروض: يحترم البحث/الفلتر النشط إن وجد
function onPaymentHistoryMonthChange() {
  const searchTerm = document.getElementById("searchPaymentStudent").value.trim();
  const filterClass = document.getElementById("filterPaymentClass").value;
  if (searchTerm || filterClass) {
    renderFilteredPaymentStatus();
  } else {
    loadStudentsPaymentStatus();
  }
}

function loadStudentsPaymentStatus() {
  const studentsList = document.getElementById("studentsPaymentStatus");
  const selectedMonth = getMonthKeyFromPicker("viewPaymentMonthSelect");
  if (Object.keys(users).length === 0) {
    studentsList.innerHTML = "<p>لا توجد حسابات طلاب</p>";
    return;
  }
  // جمع الطلاب حسب الصف
  const studentsByClass = {};
  for (const [studentId, info] of Object.entries(users)) {
    if (info.type === "student") {
      if (!studentsByClass[info.studentClass]) {
        studentsByClass[info.studentClass] = [];
      }
      studentsByClass[info.studentClass].push({
        id: studentId,
        info: info
      });
    }
  }
  let html = `<h3>حالة دفع الطلاب — ${formatMonthLabel(
    selectedMonth
  )}</h3>`;
  if (Object.keys(studentsByClass).length === 0) {
    html += "<p>لا توجد حسابات طلاب</p>";
    studentsList.innerHTML = html;
    return;
  }
  // ترتيب الصفوف أبجديًا
  const sortedClasses = Object.keys(studentsByClass).sort();
  sortedClasses.forEach((studentClass) => {
    const students = studentsByClass[studentClass];
    html += `
            <div class="class-section">
                <h4 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                    الصف: ${studentClass} - عدد الطلاب: ${students.length}
                </h4>
        `;
    students.forEach((student) => {
      const paymentInfo = getStudentPaymentStatus(student.id, selectedMonth);
      html += `
                <div class="payment-status-card">
                    <div class="student-info">
                        <p><strong>الاسم:</strong> ${student.info.name}</p>
                        <p><strong>رقم الطالب:</strong> ${student.id}</p>
                        <p><strong>موعد المجموعة:</strong> ${
                          student.info.studentGroup || "لم يتم اختيار مجموعة"
                        }</p>
                        <p><strong>حالة الدفع:</strong> 
                            <span class="payment-status-badge ${
                              paymentInfo.badgeClass
                            }">
                                ${paymentInfo.status}
                            </span>
                        </p>
                    </div>
                </div>
            `;
    });
    html += "</div>";
  });
  studentsList.innerHTML = html;
}

function loadStudentsForUpdatePaymentStatus() {
  const studentsList = document.getElementById("studentsUpdatePaymentStatus");
  if (Object.keys(users).length === 0) {
    studentsList.innerHTML = "<p>لا توجد حسابات طلاب</p>";
    return;
  }
  // جمع الطلاب حسب الصف
  const studentsByClass = {};
  for (const [studentId, info] of Object.entries(users)) {
    if (info.type === "student") {
      if (!studentsByClass[info.studentClass]) {
        studentsByClass[info.studentClass] = [];
      }
      studentsByClass[info.studentClass].push({
        id: studentId,
        info: info
      });
    }
  }
  let html = "<h3>تحديث حالة دفع الطلاب مجموعين حسب الصف</h3>";
  if (Object.keys(studentsByClass).length === 0) {
    html += "<p>لا توجد حسابات طلاب</p>";
    studentsList.innerHTML = html;
    return;
  }
  // ترتيب الصفوف أبجديًا
  const sortedClasses = Object.keys(studentsByClass).sort();
  sortedClasses.forEach((studentClass) => {
    const students = studentsByClass[studentClass];
    html += `
            <div class="class-section">
                <h4 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                    الصف: ${studentClass} - عدد الطلاب: ${students.length}
                </h4>
        `;
    students.forEach((student) => {
      const paymentInfo = getStudentPaymentStatus(student.id);
      html += `
                <div class="payment-status-card">
                    <div class="student-info">
                        <p><strong>الاسم:</strong> ${student.info.name}</p>
                        <p><strong>رقم الطالب:</strong> ${student.id}</p>
                        <p><strong>موعد المجموعة:</strong> ${
                          student.info.studentGroup || "لم يتم اختيار مجموعة"
                        }</p>
                        <p><strong>حالة الدفع:</strong> 
                            <span class="payment-status-badge ${
                              paymentInfo.badgeClass
                            }">
                                ${paymentInfo.status}
                            </span>
                        </p>
                    </div>
                    <div class="payment-actions">
                        <button class="toggle-payment-btn" onclick="togglePaymentStatus('${
                          student.id
                        }')">
                            ${
                              paymentInfo.isPaid
                                ? "إلغاء الدفع"
                                : "تحديد كمدفوع"
                            }
                        </button>
                    </div>
                </div>
            `;
    });
    html += "</div>";
  });
  studentsList.innerHTML = html;
}

// دالة مساعدة: ترجع الطلاب المطابقين لنص بحث وفلتر صف معينين
function getFilteredPaymentStudents(searchInputId, filterSelectId) {
  const searchTerm = document
    .getElementById(searchInputId)
    .value.trim()
    .toLowerCase();
  const filterClass = document.getElementById(filterSelectId).value;
  const result = [];
  for (const [studentId, info] of Object.entries(users)) {
    if (info.type !== "student") continue;
    if (filterClass && info.studentClass !== filterClass) continue;
    if (searchTerm) {
      const matches =
        info.name.toLowerCase().includes(searchTerm) ||
        studentId.toLowerCase().includes(searchTerm);
      if (!matches) continue;
    }
    result.push({ id: studentId, info: info });
  }
  return result;
}

// دالة مساعدة: تجمع قائمة طلاب حسب الصف
function groupStudentsByClass(students) {
  const studentsByClass = {};
  students.forEach((student) => {
    if (!studentsByClass[student.info.studentClass]) {
      studentsByClass[student.info.studentClass] = [];
    }
    studentsByClass[student.info.studentClass].push(student);
  });
  return studentsByClass;
}

// بحث/فلترة في شاشة "عرض حالة دفع الطلاب"
function searchPaymentStudents() {
  renderFilteredPaymentStatus();
}

function filterPaymentStudents() {
  renderFilteredPaymentStatus();
}

function renderFilteredPaymentStatus() {
  const studentsList = document.getElementById("studentsPaymentStatus");
  const searchTerm = document.getElementById("searchPaymentStudent").value.trim();
  const filterClass = document.getElementById("filterPaymentClass").value;
  const selectedMonth = getMonthKeyFromPicker("viewPaymentMonthSelect");
  if (!searchTerm && !filterClass) {
    loadStudentsPaymentStatus();
    return;
  }
  const students = getFilteredPaymentStudents(
    "searchPaymentStudent",
    "filterPaymentClass"
  );
  if (students.length === 0) {
    studentsList.innerHTML = "<p>لم يتم العثور على طلاب مطابقين</p>";
    return;
  }
  const studentsByClass = groupStudentsByClass(students);
  let html = `<h3>نتائج البحث — ${formatMonthLabel(selectedMonth)}</h3>`;
  const sortedClasses = Object.keys(studentsByClass).sort();
  sortedClasses.forEach((studentClass) => {
    const list = studentsByClass[studentClass];
    html += `
            <div class="class-section">
                <h4 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                    الصف: ${studentClass} - عدد الطلاب: ${list.length}
                </h4>
        `;
    list.forEach((student) => {
      const paymentInfo = getStudentPaymentStatus(student.id, selectedMonth);
      html += `
                <div class="payment-status-card">
                    <div class="student-info">
                        <p><strong>الاسم:</strong> ${student.info.name}</p>
                        <p><strong>رقم الطالب:</strong> ${student.id}</p>
                        <p><strong>موعد المجموعة:</strong> ${
                          student.info.studentGroup || "لم يتم اختيار مجموعة"
                        }</p>
                        <p><strong>حالة الدفع:</strong> 
                            <span class="payment-status-badge ${
                              paymentInfo.badgeClass
                            }">
                                ${paymentInfo.status}
                            </span>
                        </p>
                    </div>
                </div>
            `;
    });
    html += "</div>";
  });
  studentsList.innerHTML = html;
}

// بحث/فلترة في شاشة "تحديث حالة الدفع"
function searchUpdatePaymentStudents() {
  renderFilteredUpdatePaymentStatus();
}

function filterUpdatePaymentStudents() {
  renderFilteredUpdatePaymentStatus();
}

function renderFilteredUpdatePaymentStatus() {
  const studentsList = document.getElementById("studentsUpdatePaymentStatus");
  const searchTerm = document
    .getElementById("searchUpdatePaymentStudent")
    .value.trim();
  const filterClass = document.getElementById("filterUpdatePaymentClass").value;
  if (!searchTerm && !filterClass) {
    loadStudentsForUpdatePaymentStatus();
    return;
  }
  const students = getFilteredPaymentStudents(
    "searchUpdatePaymentStudent",
    "filterUpdatePaymentClass"
  );
  if (students.length === 0) {
    studentsList.innerHTML = "<p>لم يتم العثور على طلاب مطابقين</p>";
    return;
  }
  const studentsByClass = groupStudentsByClass(students);
  let html = "<h3>نتائج البحث</h3>";
  const sortedClasses = Object.keys(studentsByClass).sort();
  sortedClasses.forEach((studentClass) => {
    const list = studentsByClass[studentClass];
    html += `
            <div class="class-section">
                <h4 style="color: var(--primary); margin-top: 30px; border-bottom: 2px solid var(--primary); padding-bottom: 10px;">
                    الصف: ${studentClass} - عدد الطلاب: ${list.length}
                </h4>
        `;
    list.forEach((student) => {
      const paymentInfo = getStudentPaymentStatus(student.id);
      html += `
                <div class="payment-status-card">
                    <div class="student-info">
                        <p><strong>الاسم:</strong> ${student.info.name}</p>
                        <p><strong>رقم الطالب:</strong> ${student.id}</p>
                        <p><strong>موعد المجموعة:</strong> ${
                          student.info.studentGroup || "لم يتم اختيار مجموعة"
                        }</p>
                        <p><strong>حالة الدفع:</strong> 
                            <span class="payment-status-badge ${
                              paymentInfo.badgeClass
                            }">
                                ${paymentInfo.status}
                            </span>
                        </p>
                    </div>
                    <div class="payment-actions">
                        <button class="toggle-payment-btn" onclick="togglePaymentStatus('${
                          student.id
                        }')">
                            ${
                              paymentInfo.isPaid ? "إلغاء الدفع" : "تحديد كمدفوع"
                            }
                        </button>
                    </div>
                </div>
            `;
    });
    html += "</div>";
  });
  studentsList.innerHTML = html;
}

// ---------- نظام "الشهر الحالي" لحالة الدفع ----------
function getMonthKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// عرض الشهر بصيغة "سبتمبر ٢٠٢٦"
function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  return `${ARABIC_MONTHS[m - 1]} ${toArabicDigits(y)}`;
}

// كل الشهور اللي عندها بيانات دفع (+ الشهر الحالي دايمًا)، من الأحدث للأقدم
// تعبئة قائمتي الشهر والسنة (تُستخدم لكل من "تعيين الشهر الحالي" و"عرض شهر معيّن")
function populateMonthSelect(monthSelectId, monthKey) {
  const monthSelect = document.getElementById(monthSelectId);
  if (!monthSelect) return;
  monthSelect.innerHTML = ARABIC_MONTHS.map(
    (name, idx) => `<option value="${idx + 1}">${name}</option>`
  ).join("");
  const [, m] = monthKey.split("-").map(Number);
  monthSelect.value = String(m);
}

// قراءة الشهر المختار كـ "YYYY-MM" (السنة تُؤخذ تلقائيًا من السنة الحالية)
function getMonthKeyFromPicker(monthSelectId) {
  const monthSelect = document.getElementById(monthSelectId);
  if (!monthSelect || !monthSelect.value) {
    return currentPaymentMonth;
  }
  const m = monthSelect.value.padStart(2, "0");
  const y = new Date().getFullYear();
  return `${y}-${m}`;
}

// تحديث نص "الشهر الحالي" في كل شاشات حالة الدفع
function updateCurrentPaymentMonthLabel() {
  const label = `الشهر الحالي: ${formatMonthLabel(currentPaymentMonth)}`;
  ["currentPaymentMonthLabel", "currentPaymentMonthLabelView", "currentPaymentMonthLabelUpdate"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = label;
    }
  );
}

// تعيين أي شهر (سابق أو لاحق) كـ"الشهر الحالي" مباشرة، من غير التقيد بالتقدم شهر بشهر
// الطلاب اللي مالهمش سجل دفع في الشهر المختار يعتبروا تلقائيًا "غير مدفوعين" فيه
// مع الاحتفاظ الكامل بسجلات كل الشهور الأخرى
function setCurrentPaymentMonthManually() {
  const chosenMonth = getMonthKeyFromPicker("setPaymentMonthSelect");
  const messageDiv = document.getElementById("paymentStatusContent");

  if (chosenMonth === currentPaymentMonth) {
    messageDiv.className = "message";
    messageDiv.textContent = "هذا هو الشهر الحالي بالفعل.";
    setTimeout(() => {
      messageDiv.textContent = "";
    }, 2000);
    return;
  }

  const confirmed = confirm(
    `هل تريد تعيين "${formatMonthLabel(
      chosenMonth
    )}" كشهر الدفع الحالي؟\nالطلاب اللي مالهمش سجل دفع في هذا الشهر هيظهروا "غير مدفوعين"، وتبقى كل الشهور الأخرى محفوظة زي ما هي.`
  );
  if (!confirmed) return;

  currentPaymentMonth = chosenMonth;
  localStorage.setItem("currentPaymentMonth", currentPaymentMonth);
  if (useFirebase && db) db.ref('paymentStatus/currentMonth').set(currentPaymentMonth);

  if (!paymentStatus[currentPaymentMonth]) {
    paymentStatus[currentPaymentMonth] = {};
    saveData('paymentStatus', paymentStatus);
  }

  updateCurrentPaymentMonthLabel();
  populateMonthSelect("setPaymentMonthSelect", currentPaymentMonth);

  messageDiv.className = "message success";
  messageDiv.textContent = `✅ الشهر الحالي الآن: ${formatMonthLabel(
    currentPaymentMonth
  )}`;
  setTimeout(() => {
    messageDiv.textContent = "";
    messageDiv.className = "message";
  }, 3500);

  // إعادة تحميل أي قوائم معروضة حاليًا حتى تعكس الشهر الجديد فورًا
  if (document.getElementById("studentsPaymentStatus")) {
    loadStudentsPaymentStatus();
  }
  if (document.getElementById("studentsUpdatePaymentStatus")) {
    loadStudentsForUpdatePaymentStatus();
  }
}

// حذف سجلات دفع طالب من كل الشهور (يُستخدم عند حذف الطالب نفسه)
function removeStudentPaymentRecords(studentId) {
  let changed = false;
  for (const monthKey of Object.keys(paymentStatus)) {
    if (paymentStatus[monthKey][studentId]) {
      delete paymentStatus[monthKey][studentId];
      changed = true;
    }
  }
  if (changed) {
    saveData('paymentStatus', paymentStatus);
  }
}

function getStudentPaymentStatus(studentId, monthKey = currentPaymentMonth) {
  const student = users[studentId];
  if (!student)
    return {
      status: "غير محدد",
      badgeClass: "unpaid",
      paid: 0,
      remaining: 0,
      isPaid: false
    };
  const monthRecord = (paymentStatus[monthKey] || {})[studentId];
  // التحقق من حالة الدفع للشهر المطلوب
  if (monthRecord && monthRecord.isPaid) {
    return {
      status: "مدفوع بالكامل",
      badgeClass: "paid",
      paid: student.lessonFee || 0,
      remaining: 0,
      isPaid: true
    };
  }
  // الافتراضي لهذا الشهر: غير مدفوع
  return {
    status: "غير مدفوع",
    badgeClass: "unpaid",
    paid: 0,
    remaining: student.lessonFee || 0,
    isPaid: false
  };
}

function togglePaymentStatus(studentId) {
  const student = users[studentId];
  if (!student) return;
  if (!paymentStatus[currentPaymentMonth]) {
    paymentStatus[currentPaymentMonth] = {};
  }
  // تهيئة حالة الدفع لهذا الشهر إذا لم تكن موجودة
  if (!paymentStatus[currentPaymentMonth][studentId]) {
    paymentStatus[currentPaymentMonth][studentId] = {
      isPaid: false,
      updatedAt: new Date().toLocaleString("ar-EG")
    };
  }
  // تبديل الحالة
  paymentStatus[currentPaymentMonth][studentId].isPaid =
    !paymentStatus[currentPaymentMonth][studentId].isPaid;
  paymentStatus[currentPaymentMonth][studentId].updatedAt =
    new Date().toLocaleString("ar-EG");
  // حفظ التغييرات
  saveData('paymentStatus', paymentStatus);
  // إعادة تحميل القائمة

  loadStudentsForUpdatePaymentStatus();
  // عرض رسالة نجاح
  const messageDiv = document.getElementById("paymentStatusContent");
  messageDiv.className = "message success";
  messageDiv.textContent = paymentStatus[studentId].isPaid
    ? `✅ تم تحديد الطالب ${student.name} كمدفوع`
    : `✅ تم إلغاء دفع الطالب ${student.name}`;
  setTimeout(() => {
    messageDiv.textContent = "";
    messageDiv.className = "message";
  }, 2000);
}

// توليد رقم طالب عشوائي تلقائيًا عند فتح شاشة إنشاء الحساب
document
  .getElementById("createAccountScreen")
  .addEventListener("click", function () {
    if (!document.getElementById("newStudentId").value) {
      generateRandomStudentId();
    }
  });

// إيقاف الكاميرا عند مغادرة الصفحة
window.addEventListener("beforeunload", function () {
  stopCamera();
});

// تهيئة النظام عند تحميل الصفحة
const PUBLIC_SCREENS = ["mainScreen", "studentLoginScreen", "teacherLoginScreen", "createAccountScreen"];

// شاشات الطالب: كل شاشة ودالة فتحها (بتجهّز محتواها)
const STUDENT_SCREEN_OPENERS = {
  studentDashboard: () => showStudentDashboard(),
  studentSchedule: () => showScheduleScreen()
};

// شاشات المعلم: الشاشات اللي محتاجة بيانات مؤقتة (زي تعديل طالب) بترجع لقائمتها
const TEACHER_SCREEN_OPENERS = {
  teacherDashboard: () => showTeacherDashboard(),
  selectClassScreen: () => showClassAttendance(),
  managePaymentStatusScreen: () => managePaymentStatus(),
  viewPaymentStatusScreen: () => viewStudentsPaymentStatus(),
  updatePaymentStatusScreen: () => updatePaymentStatus(),
  scheduleManagement: () => manageSchedules(),
  manageStudents: () => manageStudents(),
  addStudentForm: () => showAddStudentForm(),
  editStudentForm: () => manageStudents(),
  qrScanner: () => showAttendanceScanner(),
  manualAttendance: () => showManualAttendance()
};

function getWantedScreen() {
  const hashScreen = window.location.hash ? window.location.hash.substring(1) : "";
  if (hashScreen && document.getElementById(hashScreen)) return hashScreen;
  const saved = localStorage.getItem("currentScreen");
  if (saved && document.getElementById(saved)) return saved;
  return "mainScreen";
}

function restoreSession() {
  const wanted = getWantedScreen();
  const savedStudentId = localStorage.getItem("currentStudentId");
  const savedTeacherId = localStorage.getItem("currentTeacherId");

  // معلم مسجل دخوله
  if (savedTeacherId === TEACHER_ID) {
    currentTeacher = { id: savedTeacherId };
    const open = TEACHER_SCREEN_OPENERS[wanted] || TEACHER_SCREEN_OPENERS.teacherDashboard;
    open();
    return TEACHER_SCREEN_OPENERS[wanted] ? wanted : "teacherDashboard";
  }

  // طالب مسجل دخوله
  if (savedStudentId && users[savedStudentId]) {
    currentStudent = users[savedStudentId];
    currentStudent.id = savedStudentId;
    const open = STUDENT_SCREEN_OPENERS[wanted] || STUDENT_SCREEN_OPENERS.studentDashboard;
    open();
    return STUDENT_SCREEN_OPENERS[wanted] ? wanted : "studentDashboard";
  }

  // مش مسجل دخول: الشاشات العامة بس
  const target = PUBLIC_SCREENS.includes(wanted) ? wanted : "mainScreen";
  showScreen(target);
  return target;
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("نظام حضور الطلاب جاهز!");
  // تهيئة قائمة المجموعات في نماذج الإضافة والتعديل
  document.getElementById("editStudentGroup").innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
  document.getElementById("addStudentGroup").innerHTML =
    '<option value="">اختر موعد المجموعة (إجباري)</option>';
  document.getElementById("studentGroup").innerHTML =
    '<option value="">اختر موعد المجموعة</option>';

  const savedStudentId = localStorage.getItem("currentStudentId");
  const needsWait =
    savedStudentId && !users[savedStudentId] && firebaseReady;

  const finish = () => {
    const restored = restoreSession();
    // بعد وصول بيانات Firebase الأحدث، حدّث نفس الشاشة (لو المستخدم لسه فيها)
    if (firebaseReady && !needsWait && restored !== "qrScanner") {
      firebaseReady.then(() => {
        const current = document.querySelector(".screen.active");
        if (current && current.id === restored) restoreSession();
      });
    }
  };

  if (needsWait) {
    // استنى بيانات الطلاب من Firebase (بحد أقصى 5 ثواني) بدل ما يرجّعك للرئيسية
    Promise.race([
      firebaseReady,
      new Promise((resolve) => setTimeout(resolve, 5000))
    ]).then(finish);
  } else {
    finish();
  }
});
