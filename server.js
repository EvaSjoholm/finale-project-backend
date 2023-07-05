import express from "express";
import cors from "cors";
import mongoose from "mongoose";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;


// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  res.send("Hello Moto");
});


// QUUESTION STRUCTURE 
const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true
  },
});


// OVERALL QUIZ STRUCTURE 
const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  questions: {
    type: [QuestionSchema],
    required: true,
  }
});

const Quiz = mongoose.model("Quiz", QuizSchema);
app.get("/quizzes", async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (error) {
    console.error("Error retrieving quizzes:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/quizzes", async (req, res) => {
  try {
  const newQuiz = await new Quiz(req.body).save()
    res.status(201).json({
      success: true,
      response: newQuiz,
      message: "Created successfully"
    });
  } catch (e) {
    res.status(400).json({
      success: false,
      response: e,
      message: "Could not save"
    });
  }
});





// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
