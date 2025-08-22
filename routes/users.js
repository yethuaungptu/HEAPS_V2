var express = require("express");
var router = express.Router();
var User = require("../models/User");
var Ticket = require("../models/Ticket");
var moment = require("moment-timezone");
var Feedback = require("../models/Feedback");

const checkUser = function (req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login?error=Please login");
  }
};

/* GET users listing. */
router.get("/", checkUser, async function (req, res, next) {
  const user = await User.findById(req.session.user.id);
  const ticketSolved = await Ticket.find({
    author: user._id,
    status: { $in: ["resolved", "closed"] },
  }).sort({ updatedAt: -1 });
  const ticketNotSolved = await Ticket.find({
    author: user._id,
    status: { $in: ["open", "pending"] },
  }).sort({ updatedAt: -1 });
  console.log(ticketNotSolved, ticketSolved);
  res.render("user/index", {
    title: "User Profile",
    user: user,
    ticketNotSolved: ticketNotSolved,
    ticketSolved: ticketSolved,
  });
});

router.get("/ticket/create", checkUser, async function (req, res) {
  res.render("user/createTicket");
});

router.post("/ticket/create", checkUser, async function (req, res) {
  try {
    const ticket = new Ticket();
    ticket.title = req.body.title;
    ticket.question = req.body.question;
    ticket.author = req.session.user.id;
    ticket.priority = req.body.priority;
    await ticket.save();
    res.redirect("/user");
  } catch (e) {
    console.log(e);
    res.redirect("/user/ticket/create");
  }
});

router.get("/ticket/:id", checkUser, async function (req, res) {
  try {
    const ticket = await Ticket.findById(req.params.id).populate("author");
    if (!ticket) {
      return res.redirect("/user");
    }
    res.render("user/ticket", {
      title: "Ticket Details",
      ticket: ticket,
      user: req.session.user,
    });
  } catch (e) {
    console.log(e);
    res.redirect("/user");
  }
});

router.post("/ticket/sendMessage", async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.body.ticketId,
      {
        $push: {
          answers: {
            isAuthor: true,
            message: req.body.message,
            createdAt: moment.utc(Date.now()).tz("Asia/Yangon").format(),
          },
        },
        updatedAt: moment.utc(Date.now()).tz("Asia/Yangon").format(),
      },
      { new: true }
    );
    if (!ticket) {
      return res.json({ error: "Ticket not found", status: "error" });
    }
    res.json({
      status: "success",
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.json({ status: "error", error: "Failed to send message" });
  }
});

router.post("/ticket/changeStatus", async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.body.ticketId, {
      status: req.body.status,
      updatedAt: moment.utc(Date.now()).tz("Asia/Yangon").format(), // Update the updatedAt field
    });
    if (!ticket) {
      return res.json({ error: "Ticket not found", status: "error" });
    }
    res.json({
      status: "success",
      message: "Status changed successfully",
    });
  } catch (error) {
    console.error("Error changing status:", error);
    res.json({ status: "error", error: "Failed to change status" });
  }
});

router.post("/feedback", checkUser, async function (req, res) {
  try {
    const feedback = new Feedback();
    feedback.user = req.session.user.id;
    feedback.rating = req.body.rating ? req.body.rating : 3;
    feedback.feedbackText = req.body.feedbackText;
    await feedback.save();
    res.redirect("/feedback");
  } catch (e) {
    res.redirect("/feedback");
  }
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
