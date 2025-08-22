var express = require("express");
var router = express.Router();
var University = require("../models/University");
var Student = require("../models/Student");
var User = require("../models/User");
var Feedback = require("../models/Feedback");

// Data Mining Functions
function calculatePredictionPercentage(student, university) {
  const minMark =
    student.gender === "Male"
      ? university.minMarkMale
      : university.minMarkFemale;
  if (!university.supportedCategories.includes(student.category)) {
    return 0;
  }

  // Check if student has any subject below 40 (should be marked as fail)
  const subjects = [student.myan, student.eng, student.math];

  // Add category-specific subjects
  if (student.category === "A") {
    subjects.push(student.phy, student.chem, student.bio);
  } else if (student.category === "B") {
    subjects.push(student.phy, student.chem, student.eco);
  } else if (student.category === "C") {
    subjects.push(student.hist, student.geo, student.eco);
  }

  const hasFailingSubject = subjects.some((mark) => mark < 40);
  if (hasFailingSubject || student.status === "Fail") {
    return Math.max(0, (student.totalMark / minMark) * 30); // Very reduced chance for failing students
  }

  if (student.totalMark < minMark) {
    return Math.max(0, (student.totalMark / minMark) * 60); // Reduced chance if below minimum
  }

  const excess = student.totalMark - minMark;
  const basePercentage = 75;
  const bonusPercentage = Math.min(25, (excess / 100) * 25);

  return Math.min(95, basePercentage + bonusPercentage);
}

function predictUniversities(student, universities) {
  const predictions = [];
  if (student.status === "Fail") {
    return predictions; // No predictions for failing students
  }
  universities.forEach((university) => {
    const percentage = calculatePredictionPercentage(student, university);
    if (percentage > 0) {
      predictions.push({
        university: university,
        percentage: Math.round(percentage * 100) / 100,
      });
    }
  });

  return predictions.sort((a, b) => b.percentage - a.percentage);
}

function convertMyanmarNumeral(myanmarNum) {
  const myanmarNumerals = {
    "၀": "0",
    "၁": "1",
    "၂": "2",
    "၃": "3",
    "၄": "4",
    "၅": "5",
    "၆": "6",
    "၇": "7",
    "၈": "8",
    "၉": "9",
  };

  if (typeof myanmarNum !== "string") return parseInt(myanmarNum) || 0;

  let converted = myanmarNum;
  for (let [myanmar, english] of Object.entries(myanmarNumerals)) {
    converted = converted.replace(new RegExp(myanmar, "g"), english);
  }

  return parseInt(converted) || 0;
}

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.get("/register", function (req, res) {
  res.render("register", { title: "User Registration" });
});

router.post("/register", async (req, res, next) => {
  try {
    const exitingUser = await User.findOne({ email: req.body.email });
    if (exitingUser) {
      res.json({ status: false, message: "Exit user with this email" });
      return;
    }
    const user = new User();
    user.name = req.body.name;
    user.email = req.body.email;
    user.password = req.body.password;
    await user.save();
    res.json({ status: true, message: "User registered successfully" });
  } catch (error) {
    console.error("Error during registration:", error);
    res.json({ status: false, message: "Registration failed" });
  }
});

router.get("/login", function (req, res) {
  res.render("login", { title: "User Login" });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (user != null && User.compare(req.body.password, user.password)) {
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    res.json({ status: true, message: "Login successful" });
  } else {
    res.json({
      status: false,
      message: "Email not found or password not match",
    });
  }
});

router.get("/adminLogin", function (req, res) {
  res.render("alogin");
});

router.post("/adminLogin", function (req, res) {
  if (
    req.body.email === "heap@admin.com" &&
    req.body.password === "heapadmin2025"
  ) {
    req.session.admin = {
      email: req.body.email,
    };
    res.redirect("/admin");
  } else {
    res.redirect("/adminLogin?error=Invalid credentials");
  }
});

router.get("/prediction", function (req, res, next) {
  res.render("predict", { title: "Prediction" });
});

router.post("/predict", async (req, res) => {
  try {
    const { regionalCode, rollNo } = req.body;

    // Convert Myanmar numeral to regular number for search
    const numericRollNo = convertMyanmarNumeral(rollNo);

    const student = await Student.findOne({
      regionalCode,
      rollNo: numericRollNo,
    });

    if (!student) {
      return res.json({ success: false, message: "Student not found!" });
    }

    const universities = await University.find();
    const predictions = predictUniversities(student, universities);

    res.json({
      success: true,
      student: student,
      predictions: predictions,
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Error making prediction: " + error.message,
    });
  }
});

router.get("/university", async function (req, res) {
  var query = {};
  var filterValue = "";
  if (req.query.search) {
    filterValue = req.query.search;
    query = { region: filterValue };
  }
  const university = await University.find(query);
  res.render("university", {
    title: "University Management",
    university: university,
    filterValue: filterValue,
  });
});

router.get("/university/:id", async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      res.redirect("/university");
    }
    res.render("universityDetail", {
      title: "University Detail",
      university: university,
    });
  } catch (error) {
    console.error("Error fetching university detail:", error);
    res.redirect("/university");
  }
});

router.get("/feedback", async function (req, res) {
  const feedbackList = await Feedback.find()
    .populate("user")
    .sort({ createdAt: -1 });
  res.render("feedback", { feedbackList: feedbackList });
});

module.exports = router;
