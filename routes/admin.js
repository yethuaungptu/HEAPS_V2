var express = require("express");
var router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const Student = require("../models/Student"); // Assuming you have a Student model defined
const University = require("../models/University");
const moment = require("moment-timezone");
const upload = multer({ dest: "public/uploads/" });
const uploadImage = multer({ dest: "public/images/uploads" });

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
  res.render("admin/index", { title: "Express" });
});

router.get("/student/create", function (req, res, next) {
  res.render("admin/student/create", { title: "Express" });
});

router.post(
  "/student/upload",
  upload.single("csvFile"),
  function (req, res, next) {
    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(
        csv({
          skipLinesWithError: true,
          headers: [
            "name",
            "regionalCode",
            "rollNo",
            "myan",
            "eng",
            "math",
            "phy",
            "chem",
            "bio",
            "eco",
            "hist",
            "geo",
            "totalMark",
            "gender",
            "status",
            "academicYear",
            "category",
          ],
        })
      )
      .on("headers", (headers) => {
        console.log("CSV Headers detected:", headers);
      })
      .on("data", (data) => {
        const keys = Object.keys(data);
        const nameKey =
          keys.find((key) => key.includes("name") || key === "name") || keys[0];

        // Convert string numbers to actual numbers
        const studentData = {
          name: (data[nameKey] || data.name || "").trim(),
          regionalCode: (data.regionalCode || "").trim(),
          rollNo: convertMyanmarNumeral(data.rollNo || "0"),
          myan: parseInt(data.myan) || 0,
          eng: parseInt(data.eng) || 0,
          math: parseInt(data.math) || 0,
          phy: parseInt(data.phy) || 0,
          chem: parseInt(data.chem) || 0,
          bio: parseInt(data.bio) || 0,
          eco: parseInt(data.eco) || 0,
          hist: parseInt(data.hist) || 0,
          geo: parseInt(data.geo) || 0,
          totalMark: parseInt(data.totalMark) || 0,
          gender: (data.gender || "").trim(),
          status: (data.status || "").trim(),
          academicYear: (data.academicYear || "").trim(),
          category: (data.category || "").trim(),
        };
        results.push(studentData);
      })
      .on("end", async () => {
        try {
          await Student.insertMany(results);
          fs.unlinkSync(req.file.path);
          res.json({
            success: true,
            message: `${results.length} students uploaded successfully!`,
          });
        } catch (error) {
          res.json({
            success: false,
            message: "Error saving data: " + error.message,
          });
        }
      });
  }
);

router.get("/student/", function (req, res, next) {
  res.render("admin/student/index", { title: "Express" });
});

router.get("/api/students", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const category = req.query.category || "";
    const status = req.query.status || "";
    const gender = req.query.gender || "";

    const skip = (page - 1) * limit;

    // Build search query
    let query = { totalMark: { $gt: 0 } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { regionalCode: { $regex: search, $options: "i" } },
        { rollNo: parseInt(search) || 0 },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (gender) query.gender = gender;

    const students = await Student.find(query)
      .sort({ rollNo: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      students,
      pagination: {
        current: page,
        total: totalPages,
        limit,
        totalStudents: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  res.render("admin/university/index", {
    title: "University Management",
    university: university,
    filterValue: filterValue,
  });
});

router.get("/university/create", function (req, res) {
  res.render("admin/university/create", { title: "University Management" });
});

router.post(
  "/university/create",
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const universityData = {
        name: req.body.name,
        address: req.body.address,
        region: req.body.region,
        ranking: req.body.ranking,
        minMarkMale: parseInt(req.body.minMarkMale) || 0,
        minMarkFemale: parseInt(req.body.minMarkFemale) || 0,
        category: req.body.category,
        limitCount: parseInt(req.body.limitCount) || 0,
        supportedCategories: req.body.supportedCategories || [],
        websiteUrl: req.body.websiteUrl || "",
        image: req.file ? `/images/uploads/${req.file.filename}` : "",
      };

      const newUniversity = new University(universityData);
      await newUniversity.save();

      res.redirect("/admin/university");
    } catch (error) {
      console.error("Error creating university:", error);
      res.redirect("/admin/university/create");
    }
  }
);

router.get("/university/detail/:id", async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      res.redirect("/admin/university");
    }
    res.render("admin/university/detail", {
      title: "University Detail",
      university: university,
    });
  } catch (error) {
    console.error("Error fetching university detail:", error);
    res.redirect("/admin/university");
  }
});

router.get("/university/update/:id", async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.redirect("/admin/university");
    }
    res.render("admin/university/update", {
      university: university,
    });
  } catch (error) {
    console.error("Error fetching university for update:", error);
    res.redirect("/admin/university");
  }
});

router.post(
  "/university/update",
  uploadImage.single("image"),
  async (req, res) => {
    try {
      const universityData = {
        name: req.body.name,
        address: req.body.address,
        region: req.body.region,
        ranking: req.body.ranking,
        minMarkMale: parseInt(req.body.minMarkMale) || 0,
        minMarkFemale: parseInt(req.body.minMarkFemale) || 0,
        category: req.body.category,
        limitCount: parseInt(req.body.limitCount) || 0,
        supportedCategories: req.body.supportedCategories || [],
        websiteUrl: req.body.websiteUrl || "",
      };

      if (req.file) {
        universityData.image = `/images/uploads/${req.file.filename}`;
      }

      await University.findByIdAndUpdate(req.body.id, universityData);
      res.redirect("/admin/university");
    } catch (error) {
      console.error("Error updating university:", error);
      res.redirect(`/admin/university/update/${req.body.id}`);
    }
  }
);

module.exports = router;
