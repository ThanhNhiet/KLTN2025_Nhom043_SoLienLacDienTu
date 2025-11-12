// models/faq.model.js
const mongoose = require("mongoose");

const QaSchema = new mongoose.Schema({
  q: { type: String, required: true, trim: true },
  a: { type: String, required: true, trim: true },
}, { _id: false });

const FaqSchema = new mongoose.Schema({
  section: { type: String, required: true, trim: true, unique: true },
  QuestionsAndAnswers: { type: [QaSchema], default: [] }
}, { timestamps: true, versionKey: false });

// Text index để search nhanh trong mảng
FaqSchema.index({ "QuestionsAndAnswers.q": "text", "QuestionsAndAnswers.a": "text" });

const FaqSectionModel = mongoose.model("FaqSection", FaqSchema);

module.exports = {
  FaqSection: FaqSectionModel,
  FaqSchema
};

